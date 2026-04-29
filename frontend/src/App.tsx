import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Welcome to Smart Expense Manager</div>} />
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </Router>
  )
}

export default App
