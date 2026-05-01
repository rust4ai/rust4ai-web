import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './routes/Home'
import Blog from './routes/Blog'
import BlogPost from './routes/BlogPost'
import Tutorials from './routes/Tutorials'
import TutorialPost from './routes/TutorialPost'
import Projects from './routes/Projects'
import ProjectPost from './routes/ProjectPost'
import Newsletters from './routes/Newsletters'
import NewsletterPost from './routes/NewsletterPost'
import VerifyEmail from './routes/VerifyEmail'
import NotFound from './routes/NotFound'
import AdminLogin from './routes/admin/Login'
import Dashboard from './routes/admin/Dashboard'
import PostList from './routes/admin/PostList'
import PostEditor from './routes/admin/PostEditor'
import TutorialList from './routes/admin/TutorialList'
import TutorialEditor from './routes/admin/TutorialEditor'
import ProjectList from './routes/admin/ProjectList'
import ProjectEditor from './routes/admin/ProjectEditor'
import NewsletterList from './routes/admin/NewsletterList'
import NewsletterEditor from './routes/admin/NewsletterEditor'
import Subscribers from './routes/admin/Subscribers'
import MediaList from './routes/admin/MediaList'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/tutorials/:slug" element={<TutorialPost />} />
          <Route path="/tutorials/:slug/:page" element={<TutorialPost />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectPost />} />
          <Route path="/newsletter" element={<Newsletters />} />
          <Route path="/newsletter/:slug" element={<NewsletterPost />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/posts" element={<PostList />} />
          <Route path="/admin/posts/new" element={<PostEditor />} />
          <Route path="/admin/posts/:id" element={<PostEditor />} />
          <Route path="/admin/tutorials" element={<TutorialList />} />
          <Route path="/admin/tutorials/new" element={<TutorialEditor />} />
          <Route path="/admin/tutorials/:id" element={<TutorialEditor />} />
          <Route path="/admin/projects" element={<ProjectList />} />
          <Route path="/admin/projects/new" element={<ProjectEditor />} />
          <Route path="/admin/projects/:id" element={<ProjectEditor />} />
          <Route path="/admin/newsletters" element={<NewsletterList />} />
          <Route path="/admin/newsletters/new" element={<NewsletterEditor />} />
          <Route path="/admin/newsletters/:id" element={<NewsletterEditor />} />
          <Route path="/admin/subscribers" element={<Subscribers />} />
          <Route path="/admin/media" element={<MediaList />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
