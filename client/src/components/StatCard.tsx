interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  color?: "green" | "red" | "orange" | "blue" | "default";
}

const colorMap = {
  green: "text-green-400",
  red: "text-red-400",
  orange: "text-yellow-400",
  blue: "text-blue-400",
  default: "text-white",
};

export default function StatCard({ label, value, sub, icon, color = "default" }: StatCardProps) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${colorMap[color]} mb-1`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
