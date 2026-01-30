export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-gray-800 p-6 space-y-4">
      <h2 className="tracking-widest text-sm text-gray-400">
        .15 ARCHIVIST
      </h2>

      <nav className="flex flex-col space-y-2">
        <a href="/dashboard">Home</a>
        <a href="/dashboard/drafts">Drafts</a>
        <a href="/dashboard/published">Published</a>
        <a href="/dashboard/profile">Profile</a>
        <a href="/dashboard/art">Art</a>
        <a href="/dashboard/settings">Settings</a>
      </nav>
    </aside>
  );
}
