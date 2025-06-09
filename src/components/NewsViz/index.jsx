'use client';
import { useRef, useEffect, useState  } from 'react';
import './NewsVizGraph.css';
import App from './App.js';

export default function NewsVizGraph ({isDarkMode, storyTimeline}) {  
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isDisplayed===true) {
        setTimeout(() => {
          const visualizationDiv = document.getElementById('visualization');
          if (visualizationDiv) {
            const app = App(storyTimeline);
            app.run();
          } else {
            console.log('#visualization still not mounted!');
          }

        }, 0);
    }
  }, [isDisplayed]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsClosing(true);
        setTimeout(() => {
          setIsDisplayed(false);
          setIsClosing(false);
        }, 300); // match animation duration
      }
    }

    if (isDisplayed) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDisplayed]);


  return (
    <>
    <button 
      className={`p-2 rounded-full transition-colors  ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-400' : 'bg-gray-200 hover:bg-gray-300 text-slate-600'}`}
      onClick={() => setIsDisplayed(true)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={'1.5px'} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>

    </button>
    

    {isDisplayed && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      >
        <div
          ref={modalRef}
          className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} bg-opacity-100 rounded-lg shadow-xl p-6
                      transform transition-all duration-300 ease-out
                      w-full max-w-5xl h-[70vh]
                      ${isClosing ? 'animate-fadeOutModal' : 'animate-fadeInModal'}`}
        >

          <div className="top-right-bar-container">
            <div className="top-right-bar-options-div">
              <button className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${isDarkMode ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700' : 'bg-teal-700 text-white shadow-sm bg-teal-700 hover:bg-teal-800'}`} id="button-reset-storyline">
                Reset story            

              </button>
              <div style={{ padding: '3px' }}></div>
            </div>
          </div>

          <div className="flex layout">
            <div id="viz-and-info" className="flex flex-col overflow-hidden bg-white rounded-lg">
              <div
                id="visualization"
                className="visualization flex-grow"
                style={{ overflowX: 'scroll', scrollBehavior: 'smooth' }}
              >
                <div id="timeline-div"></div>
              </div>

              <div id="scene-info-container" className={`p-[12px] w-full h-[35%] overflow-y-auto ${isDarkMode ? 'p-4 bg-slate-700 text-white' : 'p-4 bg-gray-200 text-gray-700'}`}>
                <h2 id="event-title" className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'} `}>Select an event</h2>
                <small id="event-date"></small>
                <small id="event-location"></small>
                <div className="event-navigation" id="event-scroll">
                  <button id="previous-button" className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${isDarkMode ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700' : 'bg-teal-700 text-white shadow-sm bg-teal-700 hover:bg-teal-800'}`}>Previous event</button>
                  <button id="focus-button" className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${isDarkMode ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700' : 'bg-teal-700 text-white shadow-sm bg-teal-700 hover:bg-teal-800'}`}>Remove focus</button>
                  <button id="next-button" className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${isDarkMode ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700' : 'bg-teal-700 text-white shadow-sm bg-teal-700 hover:bg-teal-800'}`}>Next event</button>
                </div>
                <p id="event-info" className={`mb-4 pt-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Click on an event or the "Next event" button to see more information about a specific event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    </>
  );
};