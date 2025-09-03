import Navbar from '../../../components/Navbar';

export default function TraderDashboard() {
  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Trader Dashboard</h1>
        <p>Welcome, Trader 👋</p>
        <ul className="list-disc ml-6 mt-4">
          <li>Manage client contracts</li>
          <li>Post trade strategies</li>
          <li>Track escrow payments</li>
        </ul>
      </div>
    </div>
  );
}
