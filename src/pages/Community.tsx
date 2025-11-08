import React from 'react';
import Link from 'next/link';
import { PencilSquareIcon, ChatBubbleBottomCenterTextIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'; // Using outline icons

const Community = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
          <PencilSquareIcon className="h-5 w-5 mr-2" /> Share Story
        </button>
      </div>

      {/* Join Our Support Group */}
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-4 rounded-lg flex items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center">
          <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-green-700 dark:text-green-300 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-green-800 dark:text-white">Join Our Support Group</h2>
            <p className="text-sm text-green-700 dark:text-green-200">Connect with others, share experiences, and get real-time support.</p>
          </div>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">Join Now</button>
      </div>

      {/* Community Posts */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Community Posts</h2>
      <div className="space-y-4 mb-6">
        {/* Success Story Post */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">Success Story</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finally found relief!</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by Sarah M. • Sep 30</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            After trying different treatments for years, I finally found a combination that works for me. Clinical strength antiperspirant at night plus iontophor... <Link href="#" className="text-blue-600 hover:underline">Read More</Link>
          </p>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-3">
            <HandThumbUpIcon className="h-4 w-4 mr-1" /> 12 likes
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 ml-4 mr-1" /> 5 comments
          </div>
        </div>

        {/* Question Post */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">Question</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Going to a job interview tomorrow and I'm so nervous about shaking hands</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by Anonymous • Oct 1</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            Any quick tips for managing palm sweating in the moment? <Link href="#" className="text-blue-600 hover:underline">Read More</Link>
          </p>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-3">
            <HandThumbUpIcon className="h-4 w-4 mr-1" /> 8 likes
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 ml-4 mr-1" /> 15 comments
          </div>
        </div>

        {/* Tip Post */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">Tip</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Great tip for social situations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by Mike T. • Sep 29</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            I always carry a small towel or handkerchief in my pocket. It's been a game-changer for confidence in social situations. Also, keeping my hands slight... <Link href="#" className="text-blue-600 hover:underline">Read More</Link>
          </p>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-3">
            <HandThumbUpIcon className="h-4 w-4 mr-1" /> 15 likes
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 ml-4 mr-1" /> 8 comments
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upcoming Events</h2>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 p-2 rounded-lg mr-4 min-w-[50px]">
            <span className="text-xs font-medium">OCT</span>
            <span className="text-xl font-bold">09</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Support Group Meeting</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">Join us for our monthly virtual support group meeting.</p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Join</button>
      </div>
    </div>
  );
};

export default Community;