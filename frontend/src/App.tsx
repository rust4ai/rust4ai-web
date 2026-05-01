import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './routes/Home'
import Blog from './routes/Blog'
import BlogPost from './routes/BlogPost'
import VerifyEmail from './routes/VerifyEmail'
import NotFound from './routes/NotFound'
import AdminLogin from './routes/admin/Login'
import Dashboard from './routes/admin/Dashboard'
import PostList from './routes/admin/PostList'
import PostEditor from './routes/admin/PostEditor'
import Subscribers from './routes/admin/Subscribers'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/posts" element={<PostList />} />
          <Route path="/admin/posts/new" element={<PostEditor />} />
          <Route path="/admin/posts/:id" element={<PostEditor />} />
          <Route path="/admin/subscribers" element={<Subscribers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
