import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, UploadCloud, MapPin, Image as ImageIcon, 
  Trash2, Sparkles, CheckCircle2, AlertCircle, FileText 
} from 'lucide-react';

export const ReportNewIssueView: React.FC = () => {
  const { createIssue, navigate, issues, addComment, supportIssue } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Validation States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<any | null>(null);
  const [isBypassingDuplicate, setIsBypassingDuplicate] = useState(false);
  const [supportingIssue, setSupportingIssue] = useState(false);
  const [step, setStep] = useState<'form' | 'assessment'>('form');
  const [assessmentData, setAssessmentData] = useState<any | null>(null);
  const [reportQuality, setReportQuality] = useState<{ rating: string; recommendations: string[] } | null>(null);

  // Smart Duplicate & discovery States
  const [similarReports, setSimilarReports] = useState<any[]>([]);
  const [previewingIssue, setPreviewingIssue] = useState<any | null>(null);

  const parseCoordinates = (locStr: string) => {
    const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const m = locStr.match(coordRegex);
    if (m) {
      return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
    return null;
  };

  const calculateTextSimilarity = (text1: string, text2: string) => {
    const words1 = new Set((text1 || '').toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 3));
    const words2 = new Set((text2 || '').toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 3));
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let intersectionSize = 0;
    words1.forEach(w => {
      if (words2.has(w)) intersectionSize++;
    });
    
    return intersectionSize / Math.max(words1.size, words2.size);
  };

  const findSimilarReports = (latVal?: number, lngVal?: number, locVal?: string) => {
    const activeLoc = locVal || location;
    if (!title || !activeLoc) return [];

    const currentLat = latVal !== undefined ? latVal : latitude;
    const currentLng = lngVal !== undefined ? lngVal : longitude;

    const currentCoords = (currentLat !== undefined && currentLng !== undefined)
      ? { lat: currentLat, lng: currentLng }
      : parseCoordinates(activeLoc);

    const calculated = issues
      .map(issue => {
        let locationPoints = 0;
        let distanceText = '';
        const issueLat = issue.latitude !== undefined ? issue.latitude : (parseCoordinates(issue.location)?.lat);
        const issueLng = issue.longitude !== undefined ? issue.longitude : (parseCoordinates(issue.location)?.lng);

        if (currentCoords && issueLat !== undefined && issueLng !== undefined) {
          const lat1 = currentCoords.lat;
          const lng1 = currentCoords.lng;
          const lat2 = issueLat;
          const lng2 = issueLng;
          const dLat = lat1 - lat2;
          const dLng = (lng1 - lng2) * Math.cos(lat1 * Math.PI / 180);
          const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;

          if (distanceMeters <= 200) {
            locationPoints = 45;
          } else if (distanceMeters <= 1000) {
            locationPoints = 30;
          } else if (distanceMeters <= 3000) {
            locationPoints = 15;
          } else {
            locationPoints = 0;
          }
          
          if (distanceMeters < 1000) {
            distanceText = `${Math.round(distanceMeters)}m away`;
          } else {
            distanceText = `${(distanceMeters / 1000).toFixed(1)}km away`;
          }
        } else {
          const stopWords = ['street', 'st', 'road', 'rd', 'avenue', 'ave', 'lane', 'ln', 'way', 'drive', 'dr', 'and', 'near', 'at', 'detected', 'gps', 'coordinates'];
          const locWords1 = activeLoc.toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 3 && !stopWords.includes(w));
          const locWords2 = issue.location.toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 3 && !stopWords.includes(w));
          
          let overlap = 0;
          locWords1.forEach(w => {
            if (locWords2.includes(w)) overlap++;
          });

          if (overlap >= 2) {
            locationPoints = 30;
            distanceText = 'Nearby neighborhood';
          } else if (overlap === 1) {
            locationPoints = 15;
            distanceText = 'Same sector';
          } else {
            locationPoints = 0;
            distanceText = 'Unknown distance';
          }
        }

        const titleSim = calculateTextSimilarity(title, issue.title);
        const descSim = calculateTextSimilarity(description, issue.description);

        const titlePoints = titleSim * 20;
        const descPoints = descSim * 20;

        const categoryPoints = (category && issue.category === category) ? 15 : 0;

        const totalScore = Math.round(locationPoints + titlePoints + descPoints + categoryPoints);

        return {
          issue,
          distanceText,
          score: Math.min(100, totalScore),
        };
      })
      .filter(item => item.score >= 35 && item.issue.status !== 'closed' && item.issue.status !== 'resolved')
      .sort((a, b) => b.score - a.score);

    return calculated;
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: latVal, longitude: lngVal } = position.coords;
        setLatitude(latVal);
        setLongitude(lngVal);
        setLocation(`${latVal.toFixed(6)}, ${lngVal.toFixed(6)} (Detected GPS Coordinates)`);
        setDetectingLocation(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError('Could not retrieve your current location automatically. Please enter your address or coordinates manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoadingPhase, setAiLoadingPhase] = useState(0);

  const categories = [
    'Road Damage',
    'Sanitation & Waste',
    'Streetlights & Electricity',
    'Water & Sewer',
    'Parks & Recreation',
    'Public Health & Safety',
    'Other'
  ];

  // Helper: File reader to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are permitted for complaint evidence.');
      return;
    }
    
    // Check file size (limit base64 size to ~3MB to fit Firestore safely)
    if (file.size > 3 * 1024 * 1024) {
      setError('Image file is too large. Please select an image smaller than 3MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchSuggestions = async (val: string) => {
    if (!val || val.length < 3) {
      setSuggestions([]);
      return;
    }
    if (val.includes('(Detected GPS Coordinates)')) {
      return;
    }

    try {
      const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.predictions) {
          setSuggestions(data.predictions);
          setShowDropdown(data.predictions.length > 0);
        }
      }
    } catch (err) {
      console.error("Error fetching autocomplete suggestions:", err);
    }
  };

  const handleSelectSuggestion = async (suggestion: { description: string; place_id: string }) => {
    setIsGeocoding(true);
    setError('');
    setShowDropdown(false);
    try {
      const res = await fetch(`/api/geocode?place_id=${encodeURIComponent(suggestion.place_id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          setLocation(result.formatted_address);
          setLatitude(result.geometry.location.lat);
          setLongitude(result.geometry.location.lng);
        } else {
          setError("Location not found. Please select a suggestion or use your current location.");
        }
      } else {
        setError("Location not found. Please select a suggestion or use your current location.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Location not found. Please select a suggestion or use your current location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGeocodeManualInput = async (addressToGeocode: string) => {
    if (!addressToGeocode || addressToGeocode.length < 3) return;
    if (addressToGeocode.includes('(Detected GPS Coordinates)')) return;
    
    setIsGeocoding(true);
    setError('');
    try {
      const geocodeRes = await fetch(`/api/geocode?address=${encodeURIComponent(addressToGeocode)}`);
      if (geocodeRes.ok) {
        const data = await geocodeRes.json();
        if (data.results && data.results.length > 0) {
          if (data.results.length > 1) {
            const mappedSuggestions = data.results.map((r: any) => ({
              description: r.formatted_address,
              place_id: r.place_id || ''
            }));
            setSuggestions(mappedSuggestions);
            setShowDropdown(true);
          } else {
            const result = data.results[0];
            setLocation(result.formatted_address);
            setLatitude(result.geometry.location.lat);
            setLongitude(result.geometry.location.lng);
            setShowDropdown(false);
          }
        } else {
          setError("Location not found. Please select a suggestion or use your current location.");
        }
      } else {
        setError("Location not found. Please select a suggestion or use your current location.");
      }
    } catch (err) {
      console.error("Geocoding failed on manual resolve:", err);
      setError("Location not found. Please select a suggestion or use your current location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (!val) {
      setLatitude(undefined);
      setLongitude(undefined);
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (latitude && !val.includes('(Detected GPS Coordinates)')) {
      setLatitude(undefined);
      setLongitude(undefined);
    }
    fetchSuggestions(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGeocodeManualInput(location);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, forceBypass = false) => {
    if (e) e.preventDefault();
    if (!title || !description || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setValidationError(null);
    setLoading(true);

    let currentLat = latitude;
    let currentLng = longitude;
    let currentLoc = location;

    // Resolve coordinates if missing
    if (currentLat === undefined || currentLng === undefined) {
      try {
        const geocodeRes = await fetch(`/api/geocode?address=${encodeURIComponent(location)}`);
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data.results && data.results.length > 0) {
            if (data.results.length > 1) {
              const mappedSuggestions = data.results.map((r: any) => ({
                description: r.formatted_address,
                place_id: r.place_id || ''
              }));
              setSuggestions(mappedSuggestions);
              setShowDropdown(true);
              setError("Multiple matches found. Please choose the correct location from the dropdown.");
              setLoading(false);
              return;
            } else {
              const result = data.results[0];
              currentLoc = result.formatted_address;
              currentLat = result.geometry.location.lat;
              currentLng = result.geometry.location.lng;
              setLocation(result.formatted_address);
              setLatitude(currentLat);
              setLongitude(currentLng);
            }
          } else {
            setError("Location not found. Please select a suggestion or use your current location.");
            setLoading(false);
            return;
          }
        } else {
          setError("Location not found. Please select a suggestion or use your current location.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Geocoding failed on submit:", err);
        setError("Location not found. Please select a suggestion or use your current location.");
        setLoading(false);
        return;
      }
    }

    setAiLoadingPhase(1);

    const intervalOne = setTimeout(() => setAiLoadingPhase(2), 2000);
    const intervalTwo = setTimeout(() => setAiLoadingPhase(3), 4200);

    try {
      // 1. Run local similarity detection first to give immediate, rich results
      const localMatches = findSimilarReports(currentLat, currentLng, currentLoc);
      if (!forceBypass && !isBypassingDuplicate && localMatches.length > 0) {
        setSimilarReports(localMatches);
        setLoading(false);
        clearTimeout(intervalOne);
        clearTimeout(intervalTwo);
        return;
      }

      // Send existing issues list for duplicate analysis
      const existingList = issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        location: issue.location,
        category: issue.category
      }));

      const validationResponse = await fetch('/api/validate-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location: currentLoc,
          category,
          image: imagePreview || undefined,
          existingIssues: existingList
        })
      });

      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        const { evidenceValidation, duplicateAnalysis, assessment, reportQuality } = validationData;

        // Check if evidence is invalid
        if (evidenceValidation && evidenceValidation.status === 'invalid') {
          setValidationError(evidenceValidation.feedback || 'The uploaded photo does not appear to match the description. Please review your report details.');
          setLoading(false);
          clearTimeout(intervalOne);
          clearTimeout(intervalTwo);
          return;
        }

        // Check if duplicate is found by server
        if (!forceBypass && !isBypassingDuplicate && duplicateAnalysis && duplicateAnalysis.isDuplicate && duplicateAnalysis.duplicateIssueId) {
          const matchedIssue = issues.find(issue => issue.id === duplicateAnalysis.duplicateIssueId);
          if (matchedIssue) {
            setSimilarReports([{
              issue: matchedIssue,
              distanceText: 'Nearby Location',
              score: 95
            }]);
            setLoading(false);
            clearTimeout(intervalOne);
            clearTimeout(intervalTwo);
            return;
          }
        }

        // Proceed to assessment step
        if (assessment) {
          setAssessmentData(assessment);
          setReportQuality(reportQuality || null);
          setStep('assessment');
        }
      } else {
        throw new Error('Validation service is currently unavailable. Please try again.');
      }

      setLoading(false);
      clearTimeout(intervalOne);
      clearTimeout(intervalTwo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during submission. Please try again.');
      setLoading(false);
      clearTimeout(intervalOne);
      clearTimeout(intervalTwo);
    }
  };

  const handleFinalSubmit = async () => {
    if (!assessmentData) return;
    setError('');
    setLoading(true);

    try {
      const issueId = await createIssue(
        title,
        description,
        assessmentData.category || category || 'Other',
        location,
        imagePreview || undefined,
        assessmentData,
        latitude,
        longitude
      );
      
      navigate('issue-details', { id: issueId });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during submission. Please try again.');
      setLoading(false);
    }
  };

  const handleSupportDuplicate = async () => {
    if (!duplicateMatch) return;
    setSupportingIssue(true);
    setError('');

    try {
      await addComment(
        duplicateMatch.id,
        `📢 Citizen supported this issue with a duplicate observation at this location:\n"${description}"`
      );

      setSupportingIssue(false);
      navigate('issue-details', { id: duplicateMatch.id });
    } catch (err: any) {
      console.error(err);
      setError('Could not complete support operation: ' + (err.message || err));
      setSupportingIssue(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8" id="report-issue-view">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
            {step === 'form' ? 'Report New Civic Issue' : 'Review Issue Summary'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'form' 
              ? 'Fill in the details below to submit your concern. Our system will verify details, check for duplicates, and route your report to the appropriate municipal department.'
              : 'Our systems have verified and prepared your report. Please review the official routing and dispatch summary before confirming submission.'}
          </p>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center border border-gray-100 shadow-2xl animate-fade-in">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <FileText size={20} className="animate-pulse" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 font-display">
                Verifying Report Details
              </h3>
              
              <div className="mt-4 space-y-3 font-mono text-xs text-gray-500 text-left bg-gray-50 p-4 rounded-xl border border-gray-150">
                <div className="flex items-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${aiLoadingPhase >= 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className={aiLoadingPhase === 1 ? 'text-blue-600 font-semibold' : ''}>
                    [1/3] Validating uploaded evidence and details...
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${aiLoadingPhase >= 2 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className={aiLoadingPhase === 2 ? 'text-blue-600 font-semibold' : ''}>
                    [2/3] Checking for existing reports nearby...
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${aiLoadingPhase >= 3 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className={aiLoadingPhase === 3 ? 'text-blue-600 font-semibold' : ''}>
                    [3/3] Determining municipal priority and routing dispatch...
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-5 italic">
                Please wait while we establish your report routing...
              </p>
            </div>
          </div>
        )}

        {step === 'assessment' && assessmentData ? (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 border border-red-150 p-4 rounded-xl flex items-start space-x-3 text-xs">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Submission Error</span>
                  <span className="leading-relaxed block mt-0.5">{error}</span>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
              {/* Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                <div>
                  <h2 className="text-lg font-display font-bold text-gray-950 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600 shrink-0" />
                    <span>Issue Summary Preview</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pre-validated dispatcher information based on your report.
                  </p>
                </div>
              </div>

              {/* Smart Report Quality Assistant */}
              {reportQuality && (
                <div className="bg-slate-50/75 border border-gray-150 rounded-2xl p-5 space-y-4 animate-fade-in" id="report-quality-assistant">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-150/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Sparkles size={16} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-display font-bold text-gray-950">
                          Smart Report Quality Assistant
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          Quietly verifying report details to help municipal teams solve issues faster.
                        </p>
                      </div>
                    </div>
                    {/* Quality Rating Badge */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Report Quality:
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 uppercase tracking-wide ${
                        reportQuality.rating === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                        reportQuality.rating === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                        'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {reportQuality.rating === 'Excellent' && <CheckCircle2 size={13} className="text-emerald-600" />}
                        {reportQuality.rating === 'Good' && <CheckCircle2 size={13} className="text-blue-600" />}
                        {reportQuality.rating === 'Needs Improvement' && <AlertCircle size={13} className="text-amber-600" />}
                        <span>{reportQuality.rating}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quiet Evaluation Criteria Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Description completeness */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                      <div className="mt-0.5 shrink-0">
                        {!reportQuality.recommendations.some(r => r.toLowerCase().includes('description') || r.toLowerCase().includes('detail')) ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block leading-tight">Description</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {!reportQuality.recommendations.some(r => r.toLowerCase().includes('description') || r.toLowerCase().includes('detail')) ? 'Complete & Detailed' : 'Incomplete details'}
                        </span>
                      </div>
                    </div>

                    {/* Image clarity and relevance */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                      <div className="mt-0.5 shrink-0">
                        {!reportQuality.recommendations.some(r => r.toLowerCase().includes('image') || r.toLowerCase().includes('photo')) ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block leading-tight">Evidence Photo</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {!imagePreview ? 'Optional photo missing' : !reportQuality.recommendations.some(r => r.toLowerCase().includes('image') || r.toLowerCase().includes('photo')) ? 'Clear & Relevant' : 'Needs clearer image'}
                        </span>
                      </div>
                    </div>

                    {/* Location accuracy */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                      <div className="mt-0.5 shrink-0">
                        {!reportQuality.recommendations.some(r => r.toLowerCase().includes('landmark') || r.toLowerCase().includes('location') || r.toLowerCase().includes('address')) ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block leading-tight">Location Details</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {!reportQuality.recommendations.some(r => r.toLowerCase().includes('landmark') || r.toLowerCase().includes('location') || r.toLowerCase().includes('address')) ? 'Specific & Accurate' : 'Missing landmark info'}
                        </span>
                      </div>
                    </div>

                    {/* Missing information check */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                      <div className="mt-0.5 shrink-0">
                        {reportQuality.recommendations.length === 0 ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block leading-tight">Actionable Status</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {reportQuality.recommendations.length === 0 ? 'Ready for Dispatch' : `${reportQuality.recommendations.length} items to polish`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Friendly Advice */}
                  {reportQuality.recommendations.length > 0 ? (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs">
                      <span className="font-bold text-amber-800 block mb-2">
                        💡 Suggestions to make your report even more helpful:
                      </span>
                      <ul className="space-y-1.5">
                        {reportQuality.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 font-medium leading-relaxed">
                            <span className="text-amber-500 mt-0.5 select-none">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[11px] text-amber-700 font-medium italic">
                        Tip: You can click "Go Back & Edit" below to add these details, helping municipal crews solve this issue much faster!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 text-xs text-gray-700 leading-relaxed flex items-start gap-2 font-medium">
                      <span className="text-emerald-600 mt-0.5">✨</span>
                      <span>
                        Fantastic report! You've provided an extremely complete description and clear location coordinates. This gives our city crews exactly what they need to respond rapidly.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                {/* Category */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Category
                  </span>
                  <span className="text-sm font-bold text-gray-900 block">
                    {assessmentData.category || category || 'Other'}
                  </span>
                </div>

                {/* Priority */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Priority Level
                  </span>
                  <span className={`text-sm font-bold block ${
                    (assessmentData.priorityLevel || 'medium').toLowerCase() === 'critical' ? 'text-red-600' :
                    (assessmentData.priorityLevel || 'medium').toLowerCase() === 'high' ? 'text-orange-600' :
                    (assessmentData.priorityLevel || 'medium').toLowerCase() === 'medium' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {assessmentData.priorityLevel || 'Medium'}
                  </span>
                </div>

                {/* Department */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Responsible Department
                  </span>
                  <span className="text-sm font-bold text-gray-900 block">
                    {assessmentData.assignedDepartment || 'Public Works Department'}
                  </span>
                </div>

                {/* Resolution Time */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Estimated Resolution Time
                  </span>
                  <span className="text-sm font-bold text-gray-900 block">
                    {assessmentData.estimatedResolutionTime || '3-5 Days'}
                  </span>
                </div>
              </div>

              {/* Executive Summary & Actions */}
              <div className="space-y-4">
                {/* Executive Summary */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                    Executive Summary
                  </span>
                  <p className="text-sm text-gray-650 leading-relaxed">
                    {assessmentData.summary}
                  </p>
                </div>

                {/* Recommended Action */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
                    Recommended Action
                  </span>
                  <ul className="space-y-2.5">
                    {((assessmentData.actionPlan || []) as string[]).map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-gray-700 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-semibold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Assessment actions */}
            <div className="pt-4 flex justify-between items-center bg-white border border-gray-150 rounded-2xl p-6 shadow-xs">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-semibold bg-gray-50 hover:bg-gray-150 rounded-xl cursor-pointer transition-colors"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs text-sm cursor-pointer flex items-center space-x-1.5 transition-colors"
                id="confirm-submit-issue-btn"
              >
                <CheckCircle2 size={16} />
                <span>Submit Report</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Container */
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs">
            {error && (
              <div className="mb-6 bg-red-50 text-red-800 border border-red-150 p-4 rounded-xl flex items-start space-x-3 text-xs">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Submission Error</span>
                  <span className="leading-relaxed block mt-0.5">{error}</span>
                </div>
              </div>
            )}

            {/* Evidence/Image Validation Error */}
            {validationError && (
              <div className="mb-6 bg-amber-50 text-amber-900 border border-amber-200 p-5 rounded-xl flex items-start space-x-3 text-xs animate-fade-in">
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm block text-amber-950">Evidence Verification Alert</span>
                  <span className="leading-relaxed block mt-1 text-amber-900 font-medium">
                    {validationError}
                  </span>
                  <p className="mt-2 text-amber-700">
                    Please upload an authentic, relevant photo or revise the written description to ensure our dispatch teams can verify and solve the issue.
                  </p>
                  <button
                    type="button"
                    onClick={() => setValidationError(null)}
                    className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Acknowledge & Adjust
                  </button>
                </div>
              </div>
            )}

            {/* Similar Community Reports Discovery Dashboard */}
            {similarReports.length > 0 && (
              <div className="mb-8 bg-blue-50/50 border-2 border-blue-100 p-6 sm:p-8 rounded-2xl text-xs animate-fade-in space-y-6">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base block text-blue-950 font-display">
                      Similar Community Reports Detected Nearby
                    </span>
                    <p className="leading-relaxed text-blue-900 mt-1.5 font-medium text-xs sm:text-sm">
                      We found existing complaints near your location that match your description. Supporting an existing report helps municipal teams prioritize issues and reduces duplicate submissions, getting problems solved faster.
                    </p>
                  </div>
                </div>

                {/* Similar Reports Scrollable Container */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {similarReports.map((item, index) => {
                    const isHighest = index === 0;
                    const report = item.issue;
                    const score = item.score;
                    const distance = item.distanceText;

                    return (
                      <div 
                        key={report.id}
                        className={`bg-white border rounded-xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isHighest 
                            ? 'border-amber-400 ring-2 ring-amber-400/10 hover:shadow-md relative' 
                            : 'border-gray-150 hover:border-blue-350'
                        }`}
                      >
                        {isHighest && (
                          <span className="absolute -top-3 left-4 bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <Sparkles size={10} />
                            Recommended to Support
                          </span>
                        )}

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900 leading-tight">
                              {report.title}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase border border-blue-100">
                              {report.category}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                              report.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              report.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-gray-500 leading-relaxed line-clamp-2 pr-4 font-medium text-[11px]">
                            {report.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-gray-450 font-bold text-[10px] uppercase font-mono">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-gray-400" />
                              {distance}
                            </span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 ${
                              score >= 80 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {score}% match score
                            </span>
                          </div>
                        </div>

                        {/* Similar Report Action CTAs */}
                        <div className="flex sm:flex-row md:flex-col items-stretch gap-2 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewingIssue(report)}
                            className="bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-xl transition-colors text-xs cursor-pointer text-center"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            disabled={supportingIssue}
                            onClick={async () => {
                              setSupportingIssue(true);
                              try {
                                await supportIssue(report.id);
                                navigate('issue-details', { id: report.id });
                              } catch (err: any) {
                                alert("Could not complete support operation: " + err.message);
                              } finally {
                                setSupportingIssue(false);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-xs text-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 size={13} />
                            <span>Support Report</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Decision Choice Row */}
                <div className="pt-4 border-t border-blue-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSimilarReports([])}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs text-gray-650 font-bold hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer text-center transition-colors"
                  >
                    Cancel & Adjust Details
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsBypassingDuplicate(true);
                      setTimeout(() => {
                        handleSubmit({ preventDefault: () => {} } as React.FormEvent, true);
                      }, 50);
                    }}
                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-850 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-center transition-colors text-xs"
                  >
                    Continue to Submit New Report
                  </button>
                </div>
              </div>
            )}

            {/* Inline Issue Preview Modal */}
            {previewingIssue && (
              <div className="fixed inset-0 bg-gray-950/75 z-55 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 shadow-2xl relative">
                  <button
                    onClick={() => setPreviewingIssue(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-extrabold text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-3.5 inline-block">
                    {previewingIssue.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-950 font-display mb-2 tracking-tight">
                    {previewingIssue.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-5 font-semibold">
                    <MapPin size={13} className="text-gray-400" />
                    <span>{previewingIssue.location}</span>
                    <span>•</span>
                    <span className="uppercase text-blue-600">{previewingIssue.status.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 mb-6 text-xs text-gray-650 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-medium">
                    {previewingIssue.description}
                  </div>
                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setPreviewingIssue(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      Close Preview
                    </button>
                    <button
                      onClick={async () => {
                        const targetId = previewingIssue.id;
                        setPreviewingIssue(null);
                        setSupportingIssue(true);
                        try {
                          await supportIssue(targetId);
                          navigate('issue-details', { id: targetId });
                        } catch (err: any) {
                          alert("Failed to support issue: " + err.message);
                        } finally {
                          setSupportingIssue(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Support This Existing Issue
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief summary of the concern (e.g. Broken streetlight on Elm St)"
                />
              </div>

              {/* Category and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Initial Category <span className="text-gray-400">(Optional)</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Auto-detect category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 flex justify-between items-center">
                    <span>Exact Location <span className="text-red-500">*</span></span>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 focus:outline-hidden disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      id="detect-gps-btn"
                    >
                      {detectingLocation ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block"></span>
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin size={12} />
                          Auto-Detect GPS
                        </>
                      )}
                    </button>
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      {isGeocoding ? (
                        <span className="w-4 h-4 border-2 border-blue-650 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <MapPin size={16} />
                      )}
                    </span>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Street name, neighborhood, or landmark"
                    />

                    {showDropdown && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="px-4 py-2.5 text-sm text-gray-750 hover:bg-gray-50 cursor-pointer flex items-start gap-2 border-b last:border-0 border-gray-100 transition-colors"
                          >
                            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <span>{suggestion.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Provide detailed information regarding the problem. What is the scope? Are there safety hazards? What time did you notice it?"
                />
              </div>

              {/* Drag & Drop File Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Complaint Image Evidence <span className="text-gray-400">(Optional, Max 3MB)</span>
                </label>

                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      isDragActive 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-white'
                    }`}
                    id="dropzone-area"
                  >
                    <UploadCloud size={36} className={`mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-450'}`} />
                    <span className="text-sm font-bold text-gray-900">Drag & drop image here, or click to browse</span>
                    <span className="text-xs text-gray-450 mt-1">Supports PNG, JPG, or JPEG up to 3MB</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative border border-gray-150 rounded-2xl overflow-hidden bg-gray-50 p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Upload preview"
                      referrerPolicy="no-referrer"
                      className="w-32 h-32 rounded-lg object-cover border border-gray-150 shadow-xs"
                    />
                    <div className="flex flex-col text-center sm:text-left gap-1">
                      <span className="text-sm font-bold text-gray-900 flex items-center justify-center sm:justify-start space-x-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Image Evidence Selected</span>
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Image is converted and ready for secure upload</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="mt-3 flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer border border-red-150 max-w-max mx-auto sm:mx-0 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('dashboard')}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer animate-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs text-sm cursor-pointer flex items-center space-x-1.5 transition-colors"
                  id="submit-issue-btn"
                >
                  <Sparkles size={16} />
                  <span>Analyze</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
