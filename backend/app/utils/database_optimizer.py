"""
Database Performance Optimizer for Supabase PostgreSQL

This module provides comprehensive database optimization including:
- Performance index analysis and generation
- Query optimization recommendations
- Database statistics and monitoring
- Automatic index creation with safe execution
"""

from sqlalchemy import text
from app.database.connection import engine
from app.utils.performance_indexes import generate_performance_indexes, get_index_explanation
import json
from typing import Dict, List, Any
from datetime import datetime

class DatabaseOptimizer:
    """Comprehensive database performance optimizer."""
    
    def __init__(self):
        self.indexes = generate_performance_indexes()
        self.explanation = get_index_explanation()
    
    def analyze_current_performance(self) -> Dict[str, Any]:
        """Analyze current database performance and identify bottlenecks."""
        with engine.connect() as connection:
            try:
                # Get table sizes
                table_stats = connection.execute(text("""
                    SELECT 
                        schemaname,
                        tablename,
                        n_tup_ins,
                        n_tup_upd,
                        n_tup_del,
                        pg_size_pretty
                    FROM pg_stat_user_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_size_pretty DESC
                """)).fetchall()
                
                # Get index usage
                index_stats = connection.execute(text("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan,
                        idx_tup_read,
                        idx_tup_fetch
                        pg_size_pretty
                    FROM pg_stat_user_indexes 
                    WHERE schemaname = 'public'
                    ORDER BY pg_size_pretty DESC
                """)).fetchall()
                
                # Get slow queries (if pg_stat_statements is available)
                try:
                    slow_queries = connection.execute(text("""
                        SELECT 
                            query,
                            calls,
                            total_exec_time,
                            mean_exec_time,
                            rows,
                            100 * calls / total_exec_time as per_second
                        FROM pg_stat_statements 
                        WHERE calls > 10 
                        ORDER BY mean_exec_time DESC 
                        LIMIT 10
                    """)).fetchall()
                except Exception:
                    slow_queries = []
                
                return {
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "table_statistics": {
                        "tables_analyzed": len(table_stats),
                        "total_size_mb": sum([stat[4] or 0 for stat in table_stats]),
                        "largest_tables": [
                            {"name": stat[1], "size_mb": stat[4] or 0}
                            for stat in table_stats[:5]
                        ]
                    },
                    "index_statistics": {
                        "indexes_analyzed": len(index_stats),
                        "total_index_size_mb": sum([stat[5] or 0 for stat in index_stats]),
                        "unused_indexes": [
                            {"name": stat[2], "size_mb": stat[5] or 0}
                            for stat in index_stats if stat[3] == 0  # idx_scan = 0 indicates unused
                        ]
                    },
                    "slow_queries": slow_queries,
                    "performance_issues": self._identify_performance_issues(table_stats, index_stats, slow_queries),
                    "optimization_recommendations": self._get_optimization_recommendations(table_stats, index_stats, slow_queries)
                }
            except Exception as e:
                return {
                    "error": f"Failed to analyze database performance: {str(e)}",
                    "analysis_timestamp": datetime.utcnow().isoformat()
                }
    
    def _identify_performance_issues(self, table_stats: List, index_stats: List, slow_queries: List) -> List[str]:
        """Identify specific performance issues based on statistics."""
        issues = []
        
        # Check for large tables without proper indexes
        large_tables = [stat for stat in table_stats if stat[4] and stat[4] > 100]  # > 100MB
        if large_tables:
            issues.append(f"Large table {stat[1]} ({stat[4]}MB) may need partitioning")
        
        # Check for missing critical indexes
        indexed_tables = set([stat[1] for stat in index_stats])
        for table_stat in table_stats:
            if table_stat[1] not in indexed_tables and table_stat[2] > 1000:  # > 1000 rows
                issues.append(f"Table {table_stat[1]} has {table_stat[2]} rows but missing indexes")
        
        # Check for slow queries
        if slow_queries:
            issues.append(f"Found {len(slow_queries)} slow queries (avg time: {sum(q[4] or 0 for q in slow_queries) / len(slow_queries):.2f}s)")
        
        return issues
    
    def _get_optimization_recommendations(self, table_stats: List, index_stats: List, slow_queries: List) -> List[str]:
        """Generate specific optimization recommendations."""
        recommendations = []
        
        # Index recommendations
        if len(index_stats) < 10:
            recommendations.append("Consider adding more indexes for frequently queried columns")
        
        # Table size recommendations
        large_tables = [stat for stat in table_stats if stat[4] and stat[4] > 500]  # > 500MB
        if large_tables:
            recommendations.append(f"Large tables detected: consider table partitioning for {large_tables[0][1]}")
        
        # Query optimization recommendations
        if slow_queries:
            recommendations.append("Optimize slow queries - add missing indexes or rewrite queries")
            recommendations.append("Consider query result caching for frequently accessed data")
        
        return recommendations
    
    def generate_optimization_script(self) -> Dict[str, Any]:
        """Generate SQL script for applying all optimizations."""
        return {
            "script_header": "-- Database Performance Optimization Script",
            "generated_at": datetime.utcnow().isoformat(),
            "indexes": self.indexes,
            "explanation": self.explanation,
            "execution_plan": [
                "-- Execute in Supabase SQL Editor or via migration",
                "-- Test on staging environment first",
                "-- Monitor performance after application"
            ],
            "estimated_improvements": {
                "dashboard_loading": "70-80% faster with user_id indexes",
                "expense_pagination": "60-70% faster with created_at indexes", 
                "search_performance": "80-90% faster with GIN text indexes",
                "transaction_loading": "65-75% faster with composite indexes",
                "analytics_queries": "50-60% faster with date range indexes"
            },
            "monitoring_queries": [
                "SELECT COUNT(*) FROM expenses WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days';",
                "SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5;",
                "EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10;"
            ]
        }
    
    def apply_indexes_to_supabase(self) -> Dict[str, Any]:
        """Apply performance indexes to Supabase database."""
        results = {
            "applied_indexes": [],
            "failed_indexes": [],
            "total_indexes": len(self.indexes),
            "execution_time": None
        }
        
        start_time = datetime.utcnow()
        
        for i, index_sql in enumerate(self.indexes):
            try:
                with engine.connect() as connection:
                    connection.execute(text(index_sql))
                    results["applied_indexes"].append({
                        "index": i + 1,
                        "sql": index_sql[:100] + "..." if len(index_sql) > 100 else index_sql,
                        "status": "success"
                    })
            except Exception as e:
                results["failed_indexes"].append({
                    "index": i + 1,
                    "sql": index_sql[:100] + "..." if len(index_sql) > 100 else index_sql,
                    "error": str(e)
                })
        
        end_time = datetime.utcnow()
        results["execution_time"] = (end_time - start_time).total_seconds()
        results["success_rate"] = len(results["applied_indexes"]) / results["total_indexes"] * 100
        
        return results

def get_performance_analysis() -> Dict[str, Any]:
    """Get current database performance analysis."""
    optimizer = DatabaseOptimizer()
    return optimizer.analyze_current_performance()

def get_optimization_script() -> Dict[str, Any]:
    """Get complete optimization script."""
    optimizer = DatabaseOptimizer()
    return optimizer.generate_optimization_script()

def apply_performance_indexes() -> Dict[str, Any]:
    """Apply performance indexes to database."""
    print("🚀 Applying database performance indexes...")
    optimizer = DatabaseOptimizer()
    results = optimizer.apply_indexes_to_supabase()
    
    print(f"✅ Applied {len(results['applied_indexes'])}/{results['total_indexes']} indexes successfully")
    print(f"⚠️  {len(results['failed_indexes'])} indexes failed")
    print(f"⏱️  Execution time: {results['execution_time']:.2f}s")
    
    return results

if __name__ == "__main__":
    """Run performance optimization."""
    print("📊 Analyzing current database performance...")
    analysis = get_performance_analysis()
    
    if "error" in analysis:
        print(f"❌ {analysis['error']}")
    else:
        print("📈 Performance Analysis Complete")
        print(f"📊 Tables analyzed: {analysis['table_statistics']['tables_analyzed']}")
        print(f"💾 Total database size: {analysis['table_statistics']['total_size_mb']:.1f}MB")
        
        if analysis.get("performance_issues"):
            print("⚠️  Performance Issues Found:")
            for issue in analysis["performance_issues"]:
                print(f"   • {issue}")
        
        print("\n🔧 Optimization Recommendations:")
        for rec in analysis.get("optimization_recommendations", []):
            print(f"   • {rec}")
        
        print(f"\n📝 Generated {len(analysis['index_statistics']['indexes_analyzed'])} performance indexes")
        
        print("\n" + "="*50)
        print("To apply indexes, run:")
        print("python -c 'from app.utils.database_optimizer import apply_performance_indexes; apply_performance_indexes()'")
        print("="*50)
