import { Link } from 'react-router-dom'
import { HiGlobeAlt, HiChat, HiSparkles } from 'react-icons/hi'

function DisplayCard({
  className = "",
  icon = <HiSparkles className="w-4 h-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-blue-500",
  to = "/",
}) {
  const CardContent = (
    <div
      className={`relative flex h-36 w-22rem select-none flex-col justify-between rounded-xl border-2 border-gray-600/50 bg-gray-800/70 backdrop-blur-sm px-4 py-3 transition-all duration-700 display-card-after hover:border-white/20 hover:bg-gray-700/70 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="relative inline-block rounded-full bg-purple-800 p-1">
          {icon}
        </span>
        <p className={`text-lg font-medium text-white ${titleClassName}`}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-gray-300">{description}</p>
      <p className="text-gray-400">{date}</p>
    </div>
  );

  return to !== "/" ? (
    <Link to={to} className="block">
      {CardContent}
    </Link>
  ) : (
    CardContent
  );
}

export default function DisplayCards({ cards }) {
  const defaultCards = [
    {
      className: "grid-area-stack display-card-positioned-1 display-card-overlay",
      icon: <HiGlobeAlt className="w-4 h-4 text-white" />,
      title: "Browse News",
      description: "Explore latest articles",
      date: "Real-time updates",
      titleClassName: "text-purple-300",
      to: "/articles"
    },
    {
      className: "grid-area-stack display-card-positioned-2 display-card-overlay",
      icon: <HiChat className="w-4 h-4 text-white" />,
      title: "AI Assistant",
      description: "Chat with AI for insights",
      date: "Powered by AI",
      titleClassName: "text-purple-300",
      to: "/chatbot"
    },
    {
      className: "grid-area-stack display-card-positioned-3",
      icon: <HiSparkles className="w-4 h-4 text-white" />,
      title: "More Features",
      description: "Coming soon...",
      date: "Stay tuned",
      titleClassName: "text-purple-300",
      to: "/"
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid grid-template-stack place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}