import React, { useState, useRef, useLayoutEffect, useImperativeHandle } from 'react';
import { HiPaperAirplane } from 'react-icons/hi';
import { cn } from "../lib/utils";

// Auto-suggestion questions for news AI
const suggestionQuestions = [
  "What's the latest news today?",
  "Summarize trending political news",
  "Show me technology updates",
  "What's happening in business markets?",
  "Latest sports news and updates",
  "Recent entertainment industry news",
  "Health and medical news today",
  "International news headlines",
  "Economic trends and analysis",
  "Breaking news updates",
  "Climate change recent reports",
  "Startup and innovation news"
];

export const PromptBox = React.forwardRef(({ className, onSubmit, disabled, ...props }, ref) => {
  const internalTextareaRef = useRef(null);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  useImperativeHandle(ref, () => internalTextareaRef.current, []);

  useLayoutEffect(() => {
    const textarea = internalTextareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const filterSuggestions = (input) => {
    if (!input.trim()) return [];
    return suggestionQuestions.filter(question =>
      question.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 4);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (newValue.length > 2) {
      const filteredSuggestions = filterSuggestions(newValue);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
    setSelectedSuggestionIndex(-1);
    
    if (props.onChange) props.onChange(e);
  };

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit({
        message: value.trim()
      });
      setValue("");
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // Auto-submit the suggestion
    if (onSubmit) {
      onSubmit({
        message: suggestion
      });
      setValue("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className="prompt-box-container">
      <div className={cn(
        "prompt-box",
        className
      )}>
        <div className="prompt-input-wrapper">
          <textarea 
            ref={internalTextareaRef} 
            rows={1} 
            value={value} 
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything about news..." 
            disabled={disabled}
            className="prompt-textarea"
            {...props} 
          />
          
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={!hasValue || disabled} 
            className="send-button"
          >
            <HiPaperAirplane className="send-icon" />
          </button>
        </div>
      </div>

      {/* Auto-suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

PromptBox.displayName = "PromptBox";

export default PromptBox;