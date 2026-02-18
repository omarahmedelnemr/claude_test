import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Download,
  Loader2,
  ArrowLeft,
  Lock
} from 'lucide-react';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id: courseID } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]); // Array of {section: {...}, lectures: [...]}
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentItems, setContentItems] = useState({}); // lectureID -> content array
  const [formQuestions, setFormQuestions] = useState({}); // contentID -> questions array
  const [formQuestionsLoaded, setFormQuestionsLoaded] = useState({}); // contentID -> boolean (to track if questions have been fetched)
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState(null);
  const [videoPlayedTime, setVideoPlayedTime] = useState(0);
  const [pdfStartTime, setPdfStartTime] = useState(null);
  const [contentProgress, setContentProgress] = useState({}); // contentID -> progress percentage
  const [lastUpdateTime, setLastUpdateTime] = useState({}); // contentID -> last update timestamp
  const [expandedSectionId, setExpandedSectionId] = useState(null); // Section ID or 'unsectioned' for lectures without section
  const [expandedLectureId, setExpandedLectureId] = useState(null); // Only one lecture expanded at a time

  useEffect(() => {
    if (courseID && currentUser?.id) {
      fetchCourseData();
    }
    
    // Prevent body overflow when in course player
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore body overflow when leaving course player
      document.body.style.overflow = '';
    };
  }, [courseID, currentUser?.id]);

  // Track PDF and Article viewing time
  useEffect(() => {
    if (!selectedContent || (selectedContent.contentType !== 'pdf' && selectedContent.contentType !== 'article') || !pdfStartTime || isContentCompleted(selectedContent.id)) {
      return;
    }

    let lastUpdate = 0;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - pdfStartTime) / 1000);
      const secondsSinceLastUpdate = elapsed - lastUpdate;
      
      if (secondsSinceLastUpdate >= 10) {
        lastUpdate = elapsed;
        updateViewingTime(selectedContent.id, 10);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [selectedContent, pdfStartTime]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseData = await courseService.getCourseDetails(courseID);
      setCourse(courseData);

      // Fetch course sections with lectures
      const sectionsData = await courseService.getCourseLectures(courseID);
      
      // Handle both old format (flat array) and new format (sections with lectures)
      let sectionsArray = [];
      let hasSections = false;
      
      if (Array.isArray(sectionsData)) {
        // Check if it's the new format (array of sections with section objects)
        // New format: [{section: {...}, lectures: [...]}, ...]
        // Old format: [{id: 1, title: "...", section: null, ...}, ...]
        const firstItem = sectionsData[0];
        if (firstItem && firstItem.lectures !== undefined && Array.isArray(firstItem.lectures)) {
          // New format: array of sections with lectures property
          sectionsArray = sectionsData;
          hasSections = sectionsArray.some(s => s.section !== null && s.section !== undefined);
        } else {
          // Old format: flat array of lectures (no sections)
          // Each item is a lecture, not a section
          sectionsArray = [{
            section: null, // No section
            lectures: sectionsData
          }];
          hasSections = false;
        }
      } else {
        // Fallback
        sectionsArray = [];
        hasSections = false;
      }
      setSections(sectionsArray);

      // Fetch student progress
      if (currentUser.role === 'student') {
        try {
          const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
          // Progress data can be an object with overallProgress and lectures, or just an array
          const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
          const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
          
          // Set progress with overallProgress
          setProgress({
            overallProgress: overallProgress,
            lectures: progressData
          });
          
          // No longer tracking individual content progress percentages
          setContentProgress({});
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }

      // Determine which section/lecture to expand and select
      // Flatten all lectures from all sections for easier searching
      const allLectures = sectionsArray.flatMap(sectionData => sectionData.lectures || []);
      
      // If course has NO sections, load ALL lectures and their content at once
      let loadedContentItems = {};
      if (!hasSections && allLectures.length > 0) {
        console.log('Loading entire course at once (no sections)');
        // Load all content for all lectures in parallel
        const contentPromises = allLectures.map(async (lecture) => {
          try {
            const contentData = await courseService.getLectureContent(lecture.id);
            const contentArray = Array.isArray(contentData)
              ? contentData
              : contentData.content || [];
            return { lectureId: lecture.id, content: contentArray };
          } catch (err) {
            console.error(`Error fetching content for lecture ${lecture.id}:`, err);
            return { lectureId: lecture.id, content: [] };
          }
        });
        
        // Wait for all content to load
        const allContentResults = await Promise.all(contentPromises);
        allContentResults.forEach(({ lectureId, content }) => {
          loadedContentItems[lectureId] = content;
        });
        setContentItems(loadedContentItems);
        console.log(`Loaded content for ${allContentResults.length} lectures`);
      }
      
      if (allLectures.length > 0) {
        // Check URL for active lecture
        const urlLectureId = searchParams.get('lecture');
        let targetLecture = null;
        let targetContent = null;
        let targetSection = null;

        if (urlLectureId) {
          // Find lecture from URL across all sections
          for (const sectionData of sectionsArray) {
            targetLecture = sectionData.lectures?.find(l => l.id === urlLectureId);
            if (targetLecture) {
              targetSection = sectionData.section;
              break;
            }
          }
          
          if (targetLecture) {
            // Content should already be loaded if no sections, or load section if has sections
            if (hasSections) {
              // Find the section containing this lecture and load all lectures in that section
              for (const sectionData of sectionsArray) {
                if (sectionData.lectures?.some(l => l.id === targetLecture.id)) {
                  // Load all content for all lectures in this section using sectionID
                  const lecturesToLoad = (sectionData.lectures || []).filter(lecture => !contentItems[lecture.id]);
                  if (lecturesToLoad.length > 0 && sectionData.section) {
                    try {
                      // Load all content for the entire section in ONE request
                      const allContentData = await courseService.getLectureContent(null, sectionData.section.id);
                      const allContentArray = Array.isArray(allContentData)
                        ? allContentData
                        : allContentData.content || [];
                      
                      // Organize content by lecture ID
                      const newContentItems = { ...contentItems };
                      allContentArray.forEach((content) => {
                        const lectureId = content.lecture?.id || content.lectureID;
                        if (lectureId) {
                          if (!newContentItems[lectureId]) {
                            newContentItems[lectureId] = [];
                          }
                          newContentItems[lectureId].push(content);
                        }
                      });
                      
                      // Sort content by order within each lecture
                      Object.keys(newContentItems).forEach(lectureId => {
                        newContentItems[lectureId].sort((a, b) => (a.order || 0) - (b.order || 0));
                      });
                      
                      setContentItems(newContentItems);
                    } catch (err) {
                      console.error(`Error fetching content for section ${sectionData.section.id}:`, err);
                      // Fallback to lecture-by-lecture loading
                      const contentPromises = lecturesToLoad.map(async (lecture) => {
                        try {
                          const contentData = await courseService.getLectureContent(lecture.id);
                          const contentArray = Array.isArray(contentData)
                            ? contentData
                            : contentData.content || [];
                          return { lectureId: lecture.id, content: contentArray };
                        } catch (err) {
                          console.error(`Error fetching content for lecture ${lecture.id}:`, err);
                          return { lectureId: lecture.id, content: [] };
                        }
                      });
                      const results = await Promise.all(contentPromises);
                      const newContentItems = { ...contentItems };
                      results.forEach(({ lectureId, content }) => {
                        newContentItems[lectureId] = content;
                      });
                      setContentItems(newContentItems);
                    }
                  }
                  break;
                }
              }
            }
            
            // Get content for target lecture (use loadedContentItems if no sections, otherwise contentItems)
            const lectureContent = (!hasSections ? loadedContentItems : contentItems)[targetLecture.id] || [];
            
            // Check URL for active content
            const urlContentId = searchParams.get('content');
            if (urlContentId && lectureContent.length > 0) {
              targetContent = lectureContent.find(c => c.id === urlContentId);
            }
            
            if (!targetContent && lectureContent.length > 0) {
              targetContent = lectureContent[0];
            }
          }
        }

        // If no URL lecture or not found, find first uncompleted content
        if (!targetLecture || !targetContent) {
          // If has sections, we'll load section by section, so just find the target
          // If no sections, content is already loaded, so just find the target
          for (const sectionData of sectionsArray) {
            // Determine if section is unlocked (section-based unlocking)
            // A section is unlocked if:
            // 1. It's the first section in the course, OR
            // 2. All lectures in the previous section are completed
            let isSectionUnlocked = false;
            if (sectionsArray.indexOf(sectionData) === 0) {
              // First section is always unlocked
              isSectionUnlocked = true;
            } else {
              // Check if previous section is completed
              const prevSectionIndex = sectionsArray.indexOf(sectionData) - 1;
              if (prevSectionIndex >= 0) {
                const prevSection = sectionsArray[prevSectionIndex];
                const prevSectionLectures = prevSection.lectures || [];
                // Check if all lectures in previous section are completed
                const allPrevCompleted = prevSectionLectures.every(lecture => {
                  const lectureData = progress?.lectures?.find(l => l.lecture?.id === lecture.id);
                  return lectureData?.isCompleted === true;
                });
                isSectionUnlocked = allPrevCompleted;
              }
            }
            
            for (const lecture of sectionData.lectures || []) {
              // If section is unlocked, all lectures in it are unlocked
              const isUnlocked = isSectionUnlocked;
              
              if (!isUnlocked) continue;

              // Get lecture data from progress
              const lectureData = progress?.lectures?.find(l => l.lecture?.id === lecture.id);

              // Get content (should be loaded if no sections, or load section if has sections)
              let lectureContent = (!hasSections ? loadedContentItems : contentItems)[lecture.id];
              
              if (!lectureContent && hasSections) {
                // Load all content for all lectures in this section using sectionID
                const lecturesToLoad = (sectionData.lectures || []).filter(l => !contentItems[l.id]);
                if (lecturesToLoad.length > 0 && sectionData.section) {
                  try {
                    // Load all content for the entire section in ONE request
                    const allContentData = await courseService.getLectureContent(null, sectionData.section.id);
                    const allContentArray = Array.isArray(allContentData)
                      ? allContentData
                      : allContentData.content || [];
                    
                    // Organize content by lecture ID
                    const newContentItems = { ...contentItems };
                    allContentArray.forEach((content) => {
                      const lectureId = content.lecture?.id || content.lectureID;
                      if (lectureId) {
                        if (!newContentItems[lectureId]) {
                          newContentItems[lectureId] = [];
                        }
                        newContentItems[lectureId].push(content);
                      }
                    });
                    
                    // Sort content by order within each lecture
                    Object.keys(newContentItems).forEach(lectureId => {
                      newContentItems[lectureId].sort((a, b) => (a.order || 0) - (b.order || 0));
                    });
                    
                    setContentItems(newContentItems);
                    lectureContent = newContentItems[lecture.id];
                  } catch (err) {
                    console.error(`Error fetching content for section ${sectionData.section.id}:`, err);
                    // Fallback to lecture-by-lecture loading
                    const contentPromises = lecturesToLoad.map(async (l) => {
                      try {
                        const contentData = await courseService.getLectureContent(l.id);
                        const contentArray = Array.isArray(contentData)
                          ? contentData
                          : contentData.content || [];
                        return { lectureId: l.id, content: contentArray };
                      } catch (err) {
                        console.error(`Error fetching content for lecture ${l.id}:`, err);
                        return { lectureId: l.id, content: [] };
                      }
                    });
                    const results = await Promise.all(contentPromises);
                    const newContentItems = { ...contentItems };
                    results.forEach(({ lectureId, content }) => {
                      newContentItems[lectureId] = content;
                    });
                    setContentItems(newContentItems);
                    lectureContent = newContentItems[lecture.id];
                  }
                }
              }

              if (lectureContent) {
                // Find first uncompleted content
                for (const content of lectureContent) {
                  const progressContent = lectureData?.contents?.find(c => c.id === content.id);
                  const isCompleted = Boolean(progressContent?.isCompleted);
                  
                  if (!isCompleted) {
                    targetLecture = lecture;
                    targetContent = content;
                    targetSection = sectionData.section;
                    break;
                  }
                }
              }

              if (targetLecture && targetContent) break;
            }
            if (targetLecture && targetContent) break;
          }
        }

        // If still no target, use first lecture and first content from first unlocked section
        if (!targetLecture && sectionsArray.length > 0) {
          // Find first unlocked section
          let firstUnlockedSection = null;
          for (let i = 0; i < sectionsArray.length; i++) {
            const sectionData = sectionsArray[i];
            let isSectionUnlocked = false;
            if (i === 0) {
              // First section is always unlocked
              isSectionUnlocked = true;
            } else {
              // Check if previous section is completed
              const prevSection = sectionsArray[i - 1];
              const prevSectionLectures = prevSection.lectures || [];
              const allPrevCompleted = prevSectionLectures.every(prevLecture => {
                const prevLectureData = progress?.lectures?.find(l => l.lecture?.id === prevLecture.id);
                return prevLectureData?.isCompleted === true;
              });
              isSectionUnlocked = allPrevCompleted;
            }
            
            if (isSectionUnlocked && sectionData.lectures && sectionData.lectures.length > 0) {
              firstUnlockedSection = sectionData;
              break;
            }
          }
          
          if (firstUnlockedSection && firstUnlockedSection.lectures && firstUnlockedSection.lectures.length > 0) {
            targetLecture = firstUnlockedSection.lectures[0];
            targetSection = firstUnlockedSection.section;
            
            // Get content (should be loaded if no sections)
            if (hasSections && firstUnlockedSection.section) {
              // Load all content for all lectures in this section using sectionID
              const lecturesToLoad = firstUnlockedSection.lectures.filter(lecture => !contentItems[lecture.id]);
              
              if (lecturesToLoad.length > 0) {
                try {
                  // Load all content for the entire section in ONE request
                  const allContentData = await courseService.getLectureContent(null, firstUnlockedSection.section.id);
                  const allContentArray = Array.isArray(allContentData)
                    ? allContentData
                    : allContentData.content || [];
                  
                  // Organize content by lecture ID
                  const newContentItems = { ...contentItems };
                  allContentArray.forEach((content) => {
                    const lectureId = content.lecture?.id || content.lectureID;
                    if (lectureId) {
                      if (!newContentItems[lectureId]) {
                        newContentItems[lectureId] = [];
                      }
                      newContentItems[lectureId].push(content);
                    }
                  });
                  
                  // Sort content by order within each lecture
                  Object.keys(newContentItems).forEach(lectureId => {
                    newContentItems[lectureId].sort((a, b) => (a.order || 0) - (b.order || 0));
                  });
                  
                  setContentItems(newContentItems);
                  
                  // Get content for target lecture
                  if (newContentItems[targetLecture.id] && newContentItems[targetLecture.id].length > 0) {
                    targetContent = newContentItems[targetLecture.id][0];
                  }
                } catch (err) {
                  console.error(`Error fetching content for section ${firstSection.section.id}:`, err);
                  // Fallback to lecture-by-lecture loading
                  const contentPromises = lecturesToLoad.map(async (lecture) => {
                    try {
                      const contentData = await courseService.getLectureContent(lecture.id);
                      const contentArray = Array.isArray(contentData)
                        ? contentData
                        : contentData.content || [];
                      return { lectureId: lecture.id, content: contentArray };
                    } catch (err) {
                      console.error(`Error fetching content for lecture ${lecture.id}:`, err);
                      return { lectureId: lecture.id, content: [] };
                    }
                  });
                  const results = await Promise.all(contentPromises);
                  const newContentItems = { ...contentItems };
                  results.forEach(({ lectureId, content }) => {
                    newContentItems[lectureId] = content;
                  });
                  setContentItems(newContentItems);
                  
                  // Get content for target lecture
                  const targetResult = results.find(r => r.lectureId === targetLecture.id);
                  if (targetResult && targetResult.content.length > 0) {
                    targetContent = targetResult.content[0];
                  }
                }
              } else if (contentItems[targetLecture.id] && contentItems[targetLecture.id].length > 0) {
                targetContent = contentItems[targetLecture.id][0];
              }
            } else {
              // No sections - content already loaded
              if (loadedContentItems[targetLecture.id] && loadedContentItems[targetLecture.id].length > 0) {
                targetContent = loadedContentItems[targetLecture.id][0];
              }
            }
          }
        }

        // Set expanded section/lecture and select content
        if (targetLecture) {
          // Find the section containing this lecture
          let targetSectionData = null;
          for (const sectionData of sectionsArray) {
            if (sectionData.lectures?.some(l => l.id === targetLecture.id)) {
              targetSectionData = sectionData;
              break;
            }
          }
          
          if (targetSectionData) {
            const sectionId = targetSectionData.section ? targetSectionData.section.id : 'unsectioned';
            setExpandedSectionId(sectionId);
            
            // If has sections, content should already be loaded for the section
            // If no sections, content is already loaded for entire course
            // No need to load again here
          }
          
          setExpandedLectureId(targetLecture.id);
          
          // Update URL
          const newParams = new URLSearchParams(searchParams);
          newParams.set('lecture', targetLecture.id);
          if (targetContent) {
            newParams.set('content', targetContent.id);
          }
          setSearchParams(newParams, { replace: true });
          
          if (targetContent) {
            await selectContent(targetLecture, targetContent);
          } else {
            setSelectedLecture(targetLecture);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = async (sectionData) => {
    const sectionId = sectionData.section ? sectionData.section.id : 'unsectioned';
    
    // Toggle expanded state
    if (expandedSectionId === sectionId) {
      // Collapse
      setExpandedSectionId(null);
      setExpandedLectureId(null);
    } else {
      // Expand section
      setExpandedSectionId(sectionId);
      
      // Check if we need to load content for this section
      const lecturesToLoad = (sectionData.lectures || []).filter(lecture => !contentItems[lecture.id]);
      
      if (lecturesToLoad.length > 0 && sectionData.section) {
        console.log(`Loading all content for section ${sectionId} (${lecturesToLoad.length} lectures)`);
        
        try {
          // Load all content for the entire section in ONE request
          const allContentData = await courseService.getLectureContent(null, sectionData.section.id);
          const allContentArray = Array.isArray(allContentData)
            ? allContentData
            : allContentData.content || [];
          
          // Organize content by lecture ID
          const newContentItems = { ...contentItems };
          allContentArray.forEach((content) => {
            const lectureId = content.lecture?.id || content.lectureID;
            if (lectureId) {
              if (!newContentItems[lectureId]) {
                newContentItems[lectureId] = [];
              }
              newContentItems[lectureId].push(content);
            }
          });
          
          // Sort content by order within each lecture
          Object.keys(newContentItems).forEach(lectureId => {
            newContentItems[lectureId].sort((a, b) => (a.order || 0) - (b.order || 0));
          });
          
          setContentItems(newContentItems);
          console.log(`Loaded content for section ${sectionId} (${Object.keys(newContentItems).length} lectures)`);
        } catch (err) {
          console.error(`Error fetching content for section ${sectionId}:`, err);
          // Fallback: load lecture by lecture if section request fails
          const contentPromises = lecturesToLoad.map(async (lecture) => {
            try {
              const contentData = await courseService.getLectureContent(lecture.id);
              const contentArray = Array.isArray(contentData)
                ? contentData
                : contentData.content || [];
              return { lectureId: lecture.id, content: contentArray };
            } catch (err) {
              console.error(`Error fetching content for lecture ${lecture.id}:`, err);
              return { lectureId: lecture.id, content: [] };
            }
          });
          const results = await Promise.all(contentPromises);
          const newContentItems = { ...contentItems };
          results.forEach(({ lectureId, content }) => {
            newContentItems[lectureId] = content;
          });
          setContentItems(newContentItems);
        }
      } else if (lecturesToLoad.length > 0 && !sectionData.section) {
        // For unsectioned lectures (no sections), load all at once
        console.log(`Loading ${lecturesToLoad.length} unsectioned lectures`);
        const contentPromises = lecturesToLoad.map(async (lecture) => {
          try {
            const contentData = await courseService.getLectureContent(lecture.id);
            const contentArray = Array.isArray(contentData)
              ? contentData
              : contentData.content || [];
            return { lectureId: lecture.id, content: contentArray };
          } catch (err) {
            console.error(`Error fetching content for lecture ${lecture.id}:`, err);
            return { lectureId: lecture.id, content: [] };
          }
        });
        const results = await Promise.all(contentPromises);
        const newContentItems = { ...contentItems };
        results.forEach(({ lectureId, content }) => {
          newContentItems[lectureId] = content;
        });
        setContentItems(newContentItems);
      } else {
        console.log(`All lectures for section ${sectionId} already loaded`);
      }
    }
  };

  const toggleLecture = (lecture) => {
    // Toggle expanded state - no loading, content should already be loaded when section was expanded
    if (expandedLectureId === lecture.id) {
      // Collapse
      setExpandedLectureId(null);
    } else {
      // Expand - just show the content, don't load it
      // Content should already be loaded when the section was expanded
      setExpandedLectureId(lecture.id);
      
      // If content is not loaded (shouldn't happen if section was expanded first), load it
      if (!contentItems[lecture.id]) {
        // This is a fallback - ideally content should be loaded when section expands
        courseService.getLectureContent(lecture.id)
          .then(contentData => {
            const contentArray = Array.isArray(contentData)
              ? contentData
              : contentData.content || [];
            setContentItems(prev => ({
              ...prev,
              [lecture.id]: contentArray
            }));
          })
          .catch(err => {
            console.error('Error fetching lecture content:', err);
          });
      }
    }
  };

  const selectLecture = (lecture) => {
    setSelectedLecture(lecture);
    setSelectedContent(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    // Content should already be loaded when section was expanded
    // Only load if not already available (fallback)
    if (!contentItems[lecture.id]) {
      // Fallback: load content if not already loaded
      courseService.getLectureContent(lecture.id)
        .then(contentData => {
          const contentArray = Array.isArray(contentData)
            ? contentData
            : contentData.content || [];
          setContentItems(prev => ({
            ...prev,
            [lecture.id]: contentArray
          }));

          // Select first content if available
          if (contentArray.length > 0) {
            selectContent(lecture, contentArray[0]);
          }
        })
        .catch(err => {
          console.error('Error fetching lecture content:', err);
        });
    } else {
      // Content already loaded, select first one
      const content = contentItems[lecture.id];
      if (content && content.length > 0) {
        selectContent(lecture, content[0]);
      }
    }
  };

  const selectContent = async (lecture, content) => {
    setSelectedLecture(lecture);
    setSelectedContent(content);
    setQuizAnswers({});
    
    // Update URL with content
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lecture', lecture.id);
    newParams.set('content', content.id);
    setSearchParams(newParams, { replace: true });
    
    // Reset video/PDF tracking
    setVideoStartTime(null);
    setVideoPlayedTime(0);
    setPdfStartTime(null);
    setLastUpdateTime(prev => {
      const newState = { ...prev };
      delete newState[content.id];
      return newState;
    });
    
    // Check if quiz is already submitted
    const submitted = isQuizSubmitted(content.id);
    if (submitted) {
      setQuizSubmitted(true);
      const score = getQuizScore(content.id);
      setQuizScore(score);
    } else {
      setQuizSubmitted(false);
      setQuizScore(null);
    }

    // If it's a form, fetch questions (always fetch, even if submitted, to show answers)
    if (content.contentType === 'form' && !formQuestionsLoaded[content.id]) {
      try {
        const questionsData = await courseService.getFormQuestions(content.id, currentUser?.id);
        
        // Handle new response format: {questions: [...], submission: {...}}
        const questionsArray = Array.isArray(questionsData)
          ? questionsData
          : questionsData.questions || [];
        
        setFormQuestions(prev => ({
          ...prev,
          [content.id]: questionsArray
        }));
        
        setFormQuestionsLoaded(prev => ({
          ...prev,
          [content.id]: true
        }));
        
        // Load submitted answers from the response or from progress data
        if (questionsData.submission && questionsData.submission.id) {
          // If we have submission data in the response, use it
          if (questionsData.submission.answers) {
            setQuizAnswers(questionsData.submission.answers);
          }
        } else if (submitted && progress && progress.lectures) {
          // Fallback to progress data
          for (const lectureData of progress.lectures) {
            if (lectureData.contents && Array.isArray(lectureData.contents)) {
              const contentData = lectureData.contents.find(c => c.id === content.id);
              if (contentData && contentData.submission && contentData.submission.answers) {
                setQuizAnswers(contentData.submission.answers);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching form questions:', err);
      }
    }
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedContent || !currentUser) return;

    try {
      setSubmitting(true);
      
      // Log answers being sent
      console.log("=== SUBMITTING QUIZ ===");
      console.log("Content ID:", selectedContent.id);
      console.log("Student ID:", currentUser.id);
      console.log("Answers being sent:", JSON.stringify(quizAnswers, null, 2));
      
      const submissionData = await courseService.submitForm({
        contentID: selectedContent.id,
        studentID: currentUser.id,
        answers: quizAnswers
      });
      
      console.log("Submission response:", submissionData);

      // Calculate score from submission data
      const totalPoints = submissionData.totalPoints || selectedContent.totalPoints || 0;
      const earnedPoints = submissionData.pointsEarned || 0;
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      
      setQuizScore(score);
      setQuizSubmitted(true);
      
      // Store grading results for display
      if (submissionData.gradingResults) {
        // Update form questions with grading results
        const currentQuestions = formQuestions[selectedContent.id] || [];
        const updatedQuestions = currentQuestions.map(q => {
          const gradingResult = submissionData.gradingResults.find(gr => gr.questionId === q.id);
          if (gradingResult) {
            return {
              ...q,
              studentAnswer: gradingResult.studentAnswer,
              correctAnswer: gradingResult.correctAnswer,
              isCorrect: gradingResult.isCorrect
            };
          }
          return q;
        });
        setFormQuestions(prev => ({
          ...prev,
          [selectedContent.id]: updatedQuestions
        }));
      }
      
      // Refresh progress to get updated completion status
      const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
      const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
      const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
      setProgress({
        overallProgress: overallProgress,
        lectures: progressData
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update viewing time for content
  const updateViewingTime = async (contentId, additionalSeconds) => {
    if (!currentUser || !contentId) return;

    try {
      const response = await courseService.updateContentViewingTime({
        contentID: contentId,
        studentID: currentUser.id,
        viewingTime: additionalSeconds || 0
      });

      // If auto-completed, refresh progress
      if (response.isCompleted) {
        const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
        const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
        const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
        setProgress({
          overallProgress: overallProgress,
          lectures: progressData
        });
      }
    } catch (err) {
      console.error('Error updating viewing time:', err);
    }
  };

  // Mark article as completed
  const markArticleAsCompleted = async () => {
    if (!selectedContent || !selectedLecture || !currentUser) return;

    try {
      setSubmitting(true);
      await courseService.markContentCompleted(
        selectedLecture.id,
        selectedContent.id,
        currentUser.id
      );

      // Refresh progress
      const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
      const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
      const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
      setProgress({
        overallProgress: overallProgress,
        lectures: progressData
      });
    } catch (err) {
      console.error('Error marking article as completed:', err);
      alert(err.message || 'Failed to mark article as completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLectureCompleted = (lectureId) => {
    if (!progress || !progress.lectures) return false;
    const lectureData = progress.lectures.find(l => l.lecture?.id === lectureId);
    return lectureData?.isCompleted === true;
  };

  const isContentCompleted = (contentId) => {
    if (!progress || !progress.lectures) return false;
    // Progress is an object with lectures array
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.isCompleted === true) {
          return true;
        }
      }
    }
    return false;
  };

  const isQuizSubmitted = (contentId) => {
    if (!progress || !progress.lectures) return false;
    // Check if quiz has a submission
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.contentType === 'form' && content.submission) {
          return true;
        }
      }
    }
    return false;
  };

  const getQuizScore = (contentId) => {
    if (!progress || !progress.lectures) return null;
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.submission) {
          // Calculate score from submission
          const totalPoints = content.totalPoints || 0;
          const earnedPoints = content.submission.pointsEarned || 0;
          return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;
        }
      }
    }
    return null;
  };

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="content-placeholder">
          <p>Select a content item to start learning</p>
        </div>
      );
    }

    switch (selectedContent.contentType) {
      case 'video':
        return (
          <div className="video-player">
            <div className="video-header">
              <h3>{selectedContent.title}</h3>
              {selectedContent.duration && (
                <p className="video-duration">Duration: {selectedContent.duration} minutes</p>
              )}
            </div>
            {selectedContent.fileUrl ? (
              <div className="video-container">
                <video
                  controls
                  src={selectedContent.fileUrl}
                  className="video-element"
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    const currentTime = video.currentTime;
                    const duration = video.duration;
                    
                    if (duration > 0 && !video.paused) {
                      setVideoPlayedTime(currentTime);
                      
                      // Update viewing time every 5 seconds of playback
                      const currentSecond = Math.floor(currentTime);
                      const lastUpdate = lastUpdateTime[selectedContent.id] || 0;
                      
                      if (currentSecond > lastUpdate && currentSecond % 5 === 0) {
                        setLastUpdateTime(prev => ({ ...prev, [selectedContent.id]: currentSecond }));
                        updateViewingTime(selectedContent.id, 5);
                      }
                      
                      // Auto-complete if watched 50% of video
                      if (currentTime >= duration * 0.5 && !isContentCompleted(selectedContent.id)) {
                        updateViewingTime(selectedContent.id, 0); // Trigger completion check
                      }
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="video-placeholder">
                <PlayCircle size={64} color="var(--text-light)" />
                <p className="video-info">Video URL: {selectedContent.fileUrl || 'Not available'}</p>
              </div>
            )}
            {selectedContent.description && (
              <div className="content-description">
                <p>{selectedContent.description}</p>
              </div>
            )}
            {currentUser?.role === 'student' && isContentCompleted(selectedContent.id) && (
              <div className="content-completed-badge">
                <CheckCircle size={20} color="var(--success-color)" />
                <span>Completed</span>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="pdf-viewer">
            <div className="pdf-header">
              <FileText size={32} color="var(--primary-color)" />
              <h3>{selectedContent.title}</h3>
            </div>
            <div className="pdf-content">
              {selectedContent.description && <p>{selectedContent.description}</p>}
              {selectedContent.fileUrl ? (
                <iframe
                  src={selectedContent.fileUrl}
                  className="pdf-iframe"
                  title={selectedContent.title}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  onLoad={() => {
                    // Start tracking PDF viewing time
                    if (pdfStartTime === null) {
                      setPdfStartTime(Date.now());
                    }
                  }}
                />
              ) : (
                <p>PDF not available</p>
              )}
              {selectedContent.fileUrl && (
                <a
                  href={selectedContent.fileUrl}
                  download
                  className="download-btn"
                >
                  <Download size={18} />
                  Download PDF
                </a>
              )}
            </div>
            {currentUser?.role === 'student' && isContentCompleted(selectedContent.id) && (
              <div className="content-completed-badge">
                <CheckCircle size={20} color="var(--success-color)" />
                <span>Completed</span>
              </div>
            )}
          </div>
        );

      case 'article':
        const isArticleCompleted = currentUser?.role === 'student' && isContentCompleted(selectedContent.id);
        return (
          <div className="article-viewer">
            <div className="article-header">
              <h3>{selectedContent.title}</h3>
              {selectedContent.estimatedViewingTime && (
                <p className="article-reading-time">
                  Estimated reading time: {selectedContent.estimatedViewingTime} {selectedContent.estimatedViewingTime === 1 ? 'minute' : 'minutes'}
                </p>
              )}
            </div>
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: selectedContent.articleContent || '' }}
            />
            {currentUser?.role === 'student' && (
              <>
                {isArticleCompleted ? (
                  <div className="content-completed-badge">
                    <CheckCircle size={20} color="var(--success-color)" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <div className="article-complete-section">
                    <button
                      className="btn btn-primary mark-read-btn"
                      onClick={markArticleAsCompleted}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="spinning" />
                          <span>Marking...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          <span>Check I read it</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'form':
        const isSubmitted = isQuizSubmitted(selectedContent.id);
        const questions = formQuestions[selectedContent.id] || [];
        
        // Get submission data if quiz is already submitted
        let submissionData = null;
        let submittedAnswers = {};
        if (isSubmitted) {
          // Get submission from progress data
          if (progress && progress.lectures) {
            for (const lectureData of progress.lectures) {
              if (lectureData.contents && Array.isArray(lectureData.contents)) {
                const content = lectureData.contents.find(c => c.id === selectedContent.id);
                if (content && content.submission) {
                  submissionData = content.submission;
                  submittedAnswers = content.submission.answers || {};
                  // Load submitted answers into quizAnswers state if not already loaded
                  if (Object.keys(quizAnswers).length === 0) {
                    setQuizAnswers(submittedAnswers);
                  }
                  break;
                }
              }
            }
          }
        }

        // Check if questions are still loading
        if (!formQuestionsLoaded[selectedContent.id]) {
          return (
            <div className="quiz-container">
              <p>Loading questions...</p>
            </div>
          );
        }
        
        // Check if questions have been loaded but are empty
        if (questions.length === 0 && !isSubmitted) {
          return (
            <div className="quiz-container">
              <div className="quiz-header">
                <h3>{selectedContent.title}</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '3em 2em', color: 'var(--text-light)' }}>
                <p>No questions available for this form.</p>
              </div>
            </div>
          );
        }

        // Get score for display
        const displayScore = quizSubmitted ? quizScore : (isSubmitted ? getQuizScore(selectedContent.id) : null);
        const showResults = quizSubmitted || isSubmitted;

        return (
          <div className="quiz-container">
            <div className="quiz-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5em' }}>
                <h3 style={{ margin: 0 }}>{selectedContent.title}</h3>
                {showResults && displayScore !== null && (
                  <div className={`score-badge ${displayScore >= 70 ? 'pass' : 'fail'}`}>
                    Score: {displayScore}%
                  </div>
                )}
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
                <p>{questions.length} questions</p>
                {selectedContent.totalPoints && (
                  <p>Total Points: {selectedContent.totalPoints}</p>
                )}
              </div>
            </div>

            {showResults && displayScore !== null && (
              <div className="quiz-results">
                <div className={`score-card ${displayScore >= 70 ? 'pass' : 'fail'}`}>
                  <h2>Your Score: {displayScore}%</h2>
                  <p>
                    {displayScore >= 70
                      ? 'Congratulations! You passed!'
                      : 'Keep learning and try again!'}
                  </p>
                </div>
              </div>
            )}

            {questions.length > 0 && (
              <div className="quiz-questions">
                {questions.map((question, idx) => {
                  // Get submitted answer for this question
                  // Use studentAnswer from question if available (from backend), otherwise from state
                  const submittedAnswer = question.studentAnswer !== undefined 
                    ? question.studentAnswer 
                    : (submittedAnswers[question.id] || quizAnswers[question.id]);
                  
                  // Use isCorrect from backend if available (more reliable than frontend calculation)
                  const isCorrect = question.isCorrect !== undefined 
                    ? question.isCorrect 
                    : false;
                  
                  // Get correct answer from question (if available)
                  const correctAnswer = question.correctAnswer;
                  
                  return (
                    <div key={question.id || idx} className={`question-card ${showResults ? 'submitted' : ''}`}>
                      <h4>
                        Question {idx + 1}: {question.questionText}
                        {question.required && <span className="required">*</span>}
                        {question.points > 0 && (
                          <span className="points">({question.points} points)</span>
                        )}
                        {showResults && correctAnswer !== undefined && correctAnswer !== null && (
                          <span className={`answer-indicator ${isCorrect ? 'correct' : 'incorrect'}`}>
                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        )}
                      </h4>

                      {question.questionType === 'multiple_choice' && question.options && (
                        <div className="options">
                          {question.options.map((option, optIdx) => {
                            const isSelected = submittedAnswer === optIdx || quizAnswers[question.id] === optIdx;
                            const isCorrectOption = correctAnswer === optIdx;
                            
                            return (
                              <label 
                                key={optIdx} 
                                className={`option-label ${showResults ? 'disabled' : ''} ${showResults && isSelected && isCorrectOption ? 'correct-answer' : ''} ${showResults && isSelected && !isCorrectOption ? 'incorrect-answer' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={optIdx}
                                  onChange={() => handleQuizAnswer(question.id, optIdx)}
                                  checked={isSelected}
                                  disabled={showResults}
                                  required={question.required && !showResults}
                                />
                                <span>{option}</span>
                                {showResults && isCorrectOption && (
                                  <span className="correct-mark">✓</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {question.questionType === 'checkbox' && question.options && (
                        <div className="options">
                          {question.options.map((option, optIdx) => {
                            const currentAnswers = submittedAnswer || quizAnswers[question.id];
                            const isArray = Array.isArray(currentAnswers);
                            const isChecked = isArray && currentAnswers.includes(optIdx);
                            const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : (correctAnswer !== undefined && correctAnswer !== null ? [correctAnswer] : []);
                            const isCorrectOption = correctAnswers.includes(optIdx);
                            
                            return (
                              <label 
                                key={optIdx} 
                                className={`option-label ${showResults ? 'disabled' : ''} ${showResults && isChecked && isCorrectOption ? 'correct-answer' : ''} ${showResults && isChecked && !isCorrectOption ? 'incorrect-answer' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  name={`question-${question.id}-${optIdx}`}
                                  value={optIdx}
                                  onChange={(e) => {
                                    const current = Array.isArray(quizAnswers[question.id]) 
                                      ? quizAnswers[question.id] 
                                      : [];
                                    const updated = e.target.checked
                                      ? [...current, optIdx]
                                      : current.filter(i => i !== optIdx);
                                    handleQuizAnswer(question.id, updated);
                                  }}
                                  checked={isChecked}
                                  disabled={showResults}
                                />
                                <span>{option}</span>
                                {showResults && isCorrectOption && (
                                  <span className="correct-mark">✓</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {(question.questionType === 'short_answer' || question.questionType === 'long_answer') && (
                        <div>
                          <textarea
                            placeholder="Your answer"
                            value={submittedAnswer || quizAnswers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            className="text-answer"
                            rows={question.questionType === 'long_answer' ? 5 : 2}
                            required={question.required && !showResults}
                            disabled={showResults}
                          />
                          {showResults && correctAnswer !== undefined && correctAnswer !== null && (
                            <div className="correct-answer-display">
                              <strong>Correct Answer:</strong> {correctAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {question.questionType === 'true_false' && (
                        <div className="options">
                          <label className={`option-label ${showResults ? 'disabled' : ''} ${showResults && submittedAnswer === true && correctAnswer === true ? 'correct-answer' : ''} ${showResults && submittedAnswer === true && correctAnswer !== true ? 'incorrect-answer' : ''}`}>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="true"
                              onChange={() => handleQuizAnswer(question.id, true)}
                              checked={submittedAnswer === true || quizAnswers[question.id] === true}
                              required={question.required && !showResults}
                              disabled={showResults}
                            />
                            <span>True</span>
                            {showResults && correctAnswer === true && (
                              <span className="correct-mark">✓</span>
                            )}
                          </label>
                          <label className={`option-label ${showResults ? 'disabled' : ''} ${showResults && submittedAnswer === false && correctAnswer === false ? 'correct-answer' : ''} ${showResults && submittedAnswer === false && correctAnswer !== false ? 'incorrect-answer' : ''}`}>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="false"
                              onChange={() => handleQuizAnswer(question.id, false)}
                              checked={submittedAnswer === false || quizAnswers[question.id] === false}
                              required={question.required && !showResults}
                              disabled={showResults}
                            />
                            <span>False</span>
                            {showResults && correctAnswer === false && (
                              <span className="correct-mark">✓</span>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!showResults && (
              <button
                onClick={handleQuizSubmit}
                className="submit-quiz-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        );

      default:
        return <p>Content type not supported: {selectedContent.contentType}</p>;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>{error ? 'Error loading course' : 'Course not found'}</h2>
          <p>{error || "The course you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/courses')} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const currentContent = selectedLecture ? contentItems[selectedLecture.id] || [] : [];

  return (
    <div className="course-player-page">
      <div className="player-container">
        <div className="player-sidebar">
          <button 
            onClick={() => navigate('/')} 
            className="back-button"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="course-info">
            <h2>{course.title}</h2>
            <div className="course-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress?.overallProgress || 0}%` }}
                ></div>
              </div>
              <span>{progress?.overallProgress || 0}% Complete</span>
            </div>
          </div>

          <div className="lectures-sidebar">
            <h3>Course Content</h3>
            {sections.length === 0 ? (
              <p>No content available yet.</p>
            ) : (
              sections.map((sectionData, sectionIdx) => {
                const sectionId = sectionData.section ? sectionData.section.id : 'unsectioned';
                const isSectionExpanded = expandedSectionId === sectionId;
                const sectionLectures = sectionData.lectures || [];
                
                // Flatten all lectures to get global index for unlocking logic
                const allLectures = sections.flatMap(s => s.lectures || []);
                
                return (
                  <div key={sectionId || sectionIdx} className="section-container">
                    {sectionData.section && (
                      <div 
                        className="section-title clickable"
                        onClick={() => toggleSection(sectionData)}
                        style={{ cursor: 'pointer' }}
                      >
                        {isSectionExpanded ? (
                          <ChevronDown size={16} style={{ marginRight: '4px' }} />
                        ) : (
                          <ChevronRight size={16} style={{ marginRight: '4px' }} />
                        )}
                        <span style={{ fontWeight: 600, fontSize: '1.05em' }}>
                          {sectionData.section.title}
                        </span>
                      </div>
                    )}
                    
                    {isSectionExpanded && sectionLectures.map((lecture, lectureIdx) => {
                      const lectureContent = contentItems[lecture.id] || [];
                      const lectureData = progress?.lectures?.find(l => l.lecture?.id === lecture.id);
                      
                      // Section-based unlocking: if section is unlocked, all lectures in it are unlocked
                      let isSectionUnlocked = false;
                      if (sectionIdx === 0) {
                        // First section is always unlocked
                        isSectionUnlocked = true;
                      } else {
                        // Check if previous section is completed
                        const prevSectionIndex = sectionIdx - 1;
                        if (prevSectionIndex >= 0) {
                          const prevSection = sections[prevSectionIndex];
                          const prevSectionLectures = prevSection.lectures || [];
                          // Check if all lectures in previous section are completed
                          const allPrevCompleted = prevSectionLectures.every(prevLecture => {
                            const prevLectureData = progress?.lectures?.find(l => l.lecture?.id === prevLecture.id);
                            return prevLectureData?.isCompleted === true;
                          });
                          isSectionUnlocked = allPrevCompleted;
                        }
                      }
                      
                      // If section is unlocked, all lectures in it are unlocked
                      const isLectureUnlocked = isSectionUnlocked;
                      const isLectureCompleted = lectureData?.isCompleted === true;
                      const isExpanded = expandedLectureId === lecture.id;
                
                return (
                  <div key={lecture.id || lectureIdx} className={`lecture-section ${!isLectureUnlocked ? 'locked' : ''} ${isExpanded ? 'expanded' : ''}`}>
                    <div 
                      className="lecture-title clickable"
                      onClick={() => isLectureUnlocked && toggleLecture(lecture)}
                      style={{ cursor: isLectureUnlocked ? 'pointer' : 'not-allowed' }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ marginRight: '4px' }} />
                      ) : (
                        <ChevronRight size={16} style={{ marginRight: '4px' }} />
                      )}
                      {!isLectureUnlocked && <Lock size={16} color="#999" style={{ marginRight: '4px' }} />}
                      {isLectureCompleted && (
                        <CheckCircle size={16} color="var(--success-color)" />
                      )}
                      <span>
                        Lecture {lectureIdx + 1}: {lecture.title}
                      </span>
                    </div>
                    {!isLectureUnlocked && (
                      <p className="lecture-locked-message" style={{ fontSize: '0.875rem', color: '#999', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        Complete previous section to unlock
                      </p>
                    )}
                    {lecture.description && (
                      <p className="lecture-description">{lecture.description}</p>
                    )}

                    {isExpanded && (
                      <div className="content-items">
                        {lectureContent.length === 0 ? (
                          <p className="no-content">No content available</p>
                        ) : (
                          lectureContent.map((content, contentIdx) => {
                            const isSelected =
                              selectedLecture?.id === lecture.id &&
                              selectedContent?.id === content.id;

                            // Get completion status from progress data
                            const progressContent = lectureData?.contents?.find(c => c.id === content.id);
                            // Check if content is completed (strict boolean check)
                            const contentCompleted = Boolean(progressContent?.isCompleted);
                            const quizSubmitted = content.contentType === 'form' && isQuizSubmitted(content.id);
                            // Quizzes should always be accessible, even after submission (inputs will be disabled inside)

                            return (
                              <div key={content.id || contentIdx} className="content-item-wrapper">
                                <button
                                  className={`content-item ${isSelected ? 'active' : ''} ${contentCompleted ? 'completed' : ''}`}
                                  onClick={() => selectContent(lecture, content)}
                                  title=""
                                >
                                  {content.contentType === 'video' && <PlayCircle size={16} />}
                                  {content.contentType === 'pdf' && <FileText size={16} />}
                                  {content.contentType === 'article' && <FileText size={16} />}
                                  {content.contentType === 'form' && <span>📝</span>}
                                  <span>
                                    {content.contentType === 'video' && 'Video: '}
                                    {content.contentType === 'pdf' && 'PDF: '}
                                    {content.contentType === 'article' && 'Article: '}
                                    {content.contentType === 'form' && 'Quiz: '}
                                    {content.title}
                                  </span>
                                  {contentCompleted && (
                                    <CheckCircle size={14} color="var(--success-color)" />
                                  )}
                                  {quizSubmitted && !contentCompleted && (
                                    <span className="quiz-submitted-badge">✓</span>
                                  )}
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                    </div>
                  );
                })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="player-main">
          <div className="content-viewer">{renderContentViewer()}</div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
