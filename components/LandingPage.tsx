import React from 'react';
// FIX: Import SunIcon from `./icons` to resolve reference error.
import { ChartPieIcon, SparklesIcon, ChatBubbleOvalLeftEllipsisIcon, DocumentMagnifyingGlassIcon, CheckIcon, SunIcon } from './icons';

interface LandingPageProps {
  onLaunchApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="bg-background dark:bg-gray-900 text-text-primary dark:text-white">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ChartPieIcon className="h-8 w-8 text-primary dark:text-primary-dark" />
              <span className="ml-3 text-2xl font-bold">FinSight AI</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={onLaunchApp}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Launch App
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <div className="py-20 sm:py-28 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Meet Your Personal <span className="text-primary">AI Financial Advisor</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-secondary dark:text-gray-300 max-w-2xl mx-auto">
              Go beyond simple expense tracking. FinSight AI analyzes your spending, provides intelligent insights, and helps you achieve your financial goals faster.
            </p>
            <div className="mt-8">
              <button
                onClick={onLaunchApp}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-transform"
              >
                Get Started for Free
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Master Your Money</h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-gray-400">
                Powerful features designed to give you a complete picture of your financial health.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<SparklesIcon className="h-8 w-8 text-white" />}
                title="AI-Powered Summaries"
                description="Get instant, easy-to-understand summaries of your financial activity. Know where your money is going without crunching the numbers."
              />
              <FeatureCard
                icon={<ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-white" />}
                title="Conversational AI Chatbot"
                description="Have a question about your spending? Just ask. Our friendly AI assistant is ready to help you with personalized insights."
              />
              <FeatureCard
                icon={<DocumentMagnifyingGlassIcon className="h-8 w-8 text-white" />}
                title="Content Analysis"
                description="Analyze financial articles, reports, or any text to extract key insights and sentiment, helping you make informed decisions."
              />
               <FeatureCard
                icon={<ChartPieIcon className="h-8 w-8 text-white" />}
                title="Detailed Analytics"
                description="Visualize your spending with interactive charts and graphs. Track trends by category, date, and more."
              />
              <FeatureCard
                icon={<CheckIcon className="h-8 w-8 text-white" />}
                title="Effortless Tracking"
                description="Quickly add income and expenses with our streamlined form, featuring speech-to-text for hands-free entry."
              />
               <FeatureCard
                icon={<SunIcon className="h-8 w-8 text-white" />}
                title="Light & Dark Modes"
                description="Enjoy a comfortable viewing experience, day or night, with a beautiful and responsive interface."
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-text-secondary dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} FinSight AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};


interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <div className="bg-card dark:bg-gray-700 p-6 rounded-lg shadow-md text-left">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-text-primary dark:text-white">{title}</h3>
        <p className="mt-2 text-base text-text-secondary dark:text-gray-300">{description}</p>
    </div>
);


export default LandingPage;
