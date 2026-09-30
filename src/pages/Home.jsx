import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <main className="home">
        <section className="welcome">
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p>Your account details.</p>
        </section>
        <section className="profile-card">
          <h2>Your profile</h2>
          <dl>
            <dt>Name</dt>
            <dd>{user.name}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Mobile</dt>
            <dd>{user.phone}</dd>
            <dt>Member since</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
          </dl>
        </section>
      </main>
    </>
  )
}
