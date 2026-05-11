import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings
import openai
from app.services.expense_service import expense_service
from app.services.transaction_service import transaction_service

class ChatService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
        openai.api_key = settings.openai_api_key
        
    async def save_message(
        self, 
        user_id: str, 
        session_id: str, 
        message_type: str, 
        message_content: str,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save chat message to history"""
        try:
            result = self.supabase.table('chat_history').insert({
                'user_id': user_id,
                'session_id': session_id,
                'message_type': message_type,
                'message_content': message_content,
                'metadata': metadata or {}
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to save message: {str(e)}")
    
    async def get_chat_history(
        self, 
        user_id: str, 
        session_id: str, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get chat history for a user session"""
        try:
            result = self.supabase.table('chat_history').select('*').eq('user_id', user_id).eq('session_id', session_id).order('created_at', desc=False).limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            raise Exception(f"Failed to get chat history: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate OpenAI embedding for text"""
        try:
            response = await openai.Embedding.acreate(
                model="text-embedding-3-small",
                input=text
            )
            return response['data'][0]['embedding']
        except Exception as e:
            raise Exception(f"Failed to generate embedding: {str(e)}")
    
    async def store_rag_context(
        self, 
        user_id: str, 
        content_type: str, 
        content_id: str, 
        content_text: str,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Store content with embedding for RAG"""
        try:
            # Generate embedding
            embedding = await self.generate_embedding(content_text)
            
            # Store in rag_context table
            result = self.supabase.table('rag_context').insert({
                'user_id': user_id,
                'content_type': content_type,
                'content_id': content_id,
                'content_text': content_text,
                'embedding': embedding,
                'metadata': metadata or {}
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to store RAG context: {str(e)}")
    
    async def search_relevant_context(
        self, 
        user_id: str, 
        query: str, 
        content_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for relevant context using RAG"""
        try:
            # Generate embedding for query
            query_embedding = await self.generate_embedding(query)
            
            # Search using similarity function
            result = self.supabase.rpc('search_similar_content', {
                'p_user_id': user_id,
                'p_query_embedding': query_embedding,
                'p_content_type': content_type,
                'p_limit': limit
            }).execute()
            
            return result.data if result.data else []
        except Exception as e:
            raise Exception(f"Failed to search context: {str(e)}")
    
    async def index_user_data(self, user_id: str) -> Dict[str, int]:
        """Index all user expenses and transactions for RAG"""
        try:
            indexed_expenses = 0
            indexed_transactions = 0
            
            # Get user expenses
            expenses_result = expense_service.get_expenses({'user_id': user_id, 'limit': 1000})
            expenses = expenses_result.get('data', [])
            
            for expense in expenses:
                content_text = f"""
                Expense: {expense.get('purpose', '')}
                Amount: ₹{expense.get('amount', 0)}
                Type: {expense.get('type', '')}
                Date: {expense.get('date', '')}
                Location: {expense.get('location', '')}
                Description: {expense.get('description', '')}
                """.strip()
                
                await self.store_rag_context(
                    user_id=user_id,
                    content_type='expense',
                    content_id=expense['id'],
                    content_text=content_text,
                    metadata={
                        'amount': expense.get('amount'),
                        'date': expense.get('date'),
                        'type': expense.get('type'),
                        'purpose': expense.get('purpose')
                    }
                )
                indexed_expenses += 1
            
            # Get user transactions
            transactions_result = transaction_service.get_transactions({'user_id': user_id, 'limit': 1000})
            transactions = transactions_result.get('data', [])
            
            for transaction in transactions:
                content_text = f"""
                Transaction: {transaction.get('transaction_type', '')} from/to {transaction.get('person_name', '')}
                Amount: ₹{transaction.get('amount', 0)}
                Purpose: {transaction.get('purpose', '')}
                Given Date: {transaction.get('given_date', '')}
                Expected Return: {transaction.get('expected_return_date', '')}
                Status: {transaction.get('status', '')}
                """.strip()
                
                await self.store_rag_context(
                    user_id=user_id,
                    content_type='transaction',
                    content_id=transaction['id'],
                    content_text=content_text,
                    metadata={
                        'amount': transaction.get('amount'),
                        'person_name': transaction.get('person_name'),
                        'transaction_type': transaction.get('transaction_type'),
                        'status': transaction.get('status')
                    }
                )
                indexed_transactions += 1
            
            return {
                'expenses_indexed': indexed_expenses,
                'transactions_indexed': indexed_transactions,
                'total_indexed': indexed_expenses + indexed_transactions
            }
            
        except Exception as e:
            raise Exception(f"Failed to index user data: {str(e)}")
    
    async def generate_chat_response(
        self, 
        user_id: str, 
        session_id: str, 
        user_message: str
    ) -> Dict[str, Any]:
        """Generate AI response using RAG"""
        try:
            # Save user message
            await self.save_message(
                user_id=user_id,
                session_id=session_id,
                message_type='user',
                message_content=user_message
            )
            
            # Get relevant context
            relevant_context = await self.search_relevant_context(
                user_id=user_id,
                query=user_message,
                limit=5
            )
            
            # Build context string
            context_text = ""
            if relevant_context:
                context_text = "\n\n".join([
                    f"[{ctx['content_type'].title()}]: {ctx['content_text']}"
                    for ctx in relevant_context
                ])
            
            # Create system prompt
            system_prompt = f"""
            You are a helpful expense and transaction assistant. You have access to the user's financial data.
            Use the following context to answer their questions accurately:
            
            {context_text if context_text else "No relevant context found."}
            
            Guidelines:
            1. Be helpful and accurate
            2. Use the provided context when available
            3. If you don't have enough information, say so clearly
            4. Provide specific amounts and dates when possible
            5. Be conversational and friendly
            6. Focus on expense and transaction related questions
            """
            
            # Get chat history for context
            chat_history = await self.get_chat_history(user_id, session_id, limit=10)
            
            # Build messages for OpenAI
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add recent chat history
            for msg in chat_history[-6:]:  # Last 6 messages for context
                messages.append({
                    "role": msg['message_type'],
                    "content": msg['message_content']
                })
            
            # Generate response
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            
            # Save assistant response
            await self.save_message(
                user_id=user_id,
                session_id=session_id,
                message_type='assistant',
                message_content=assistant_message,
                metadata={
                    'context_used': len(relevant_context) > 0,
                    'context_count': len(relevant_context)
                }
            )
            
            return {
                'response': assistant_message,
                'context_used': len(relevant_context) > 0,
                'context_count': len(relevant_context),
                'relevant_context': relevant_context[:3]  # Return top 3 context items
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate response: {str(e)}")

# Global instance
chat_service = ChatService()
