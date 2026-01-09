// src/app/page.tsx
"use client";
import { useONNX } from "../hooks/useONNX";
import { useState, useRef } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function Home() {
  const { 
    loadModel, 
    processImage: processImageWithONNX, 
    isModelLoaded,
    isLoading: onnxLoading, 
    error: onnxError 
  } = useONNX();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("vangogh");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
      
      setUploadError(null);
      setSelectedImage(file);
      setCurrentStep(2);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
      
      setUploadError(null);
      setSelectedImage(file);
      setCurrentStep(2);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    setCurrentStep(3);
    
    try {
      console.log(`🔍 DEBUGGING: Selected style is: "${selectedStyle}"`);
      
      // Load model if not already loaded
      if (!isModelLoaded(selectedStyle)) {
        console.log(`📥 Loading model: ${selectedStyle}`);
        await loadModel(selectedStyle);
        console.log(`✅ Model ${selectedStyle} loaded successfully`);
      } else {
        console.log(`♻️ Model ${selectedStyle} already loaded, using existing`);
      }
      
      // Process image with ONNX model
      console.log(`🎨 Processing image with model: "${selectedStyle}"`);
      const resultImageData = await processImageWithONNX(selectedStyle, selectedImage);
      
      // Convert ImageData to displayable format
      const canvas = document.createElement('canvas');
      canvas.width = resultImageData.width;
      canvas.height = resultImageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(resultImageData, 0, 0);
      
      const processedDataUrl = canvas.toDataURL();
      setProcessedImage(processedDataUrl);
      setCurrentStep(4);
      console.log(`✅ Image processing completed successfully with model: "${selectedStyle}"`);
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing';
      setProcessingError(errorMessage);
      setCurrentStep(2); // Go back to step 2
    } finally {
      setIsProcessing(false);
    }
  };

  const styleOptions = [
    { value: "vangogh", label: "Picasso", description: "Cubist artistic style", color: "from-purple-500 to-pink-500" },
    { value: "piccasso", label: "Van Gogh", description: "Post-impressionist brushstrokes", color: "from-blue-500 to-cyan-500" },
    { value: "cyberpunk", label: "Cyberpunk", description: "Futuristic digital art", color: "from-green-500 to-teal-500" }
  ];

  const resetApp = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedImage(null);
    setUploadError(null);
    setProcessingError(null);
    setCurrentStep(1);
  };

  const isLoading = onnxLoading || isProcessing;
  const error = onnxError;

  if (isLoading && !selectedImage) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card card-elevated p-12 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Style Transfer</h1>
          <p className="text-gray-600">Initializing WebAssembly and ONNX Runtime...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card card-elevated p-12 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Error</h1>
          <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Style Transfer</h1>
                <p className="text-xs text-gray-500">Transform your photos into art</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 font-medium">Powered by ONNX Runtime</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: 'Upload Image', icon: '📤' },
              { num: 2, label: 'Choose Style', icon: '🎨' },
              { num: 3, label: 'Processing', icon: '⚡' },
              { num: 4, label: 'Download', icon: '💾' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    currentStep > step.num 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : currentStep === step.num 
                      ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-200' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.num ? '✓' : step.icon}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.num ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${
                    currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Upload Image</h2>
                {selectedImage && (
                  <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : uploadError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div className="py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">Drop your image here</p>
                    <p className="text-gray-500 text-sm mb-3">or click to browse</p>
                    <p className="text-gray-400 text-xs">Supports JPG, PNG, GIF, WebP (Max 10MB)</p>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetApp();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                        Click to change
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Choose Art Style</h2>
                {selectedImage && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                    Step 2 of 4
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {styleOptions.map((style) => (
                  <label
                    key={style.value}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedStyle === style.value
                        ? 'border-blue-500 bg-gradient-to-r ' + style.color + ' shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="style"
                      value={style.value}
                      checked={selectedStyle === style.value}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-bold text-lg mb-1 transition-colors ${
                          selectedStyle === style.value ? 'text-white' : 'text-gray-900'
                        }`}>
                          {style.label}
                        </p>
                        <p className={`text-sm transition-colors ${
                          selectedStyle === style.value ? 'text-white text-opacity-90' : 'text-gray-500'
                        }`}>
                          {style.description}
                        </p>
                      </div>
                      <div className={`ml-4 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        selectedStyle === style.value 
                          ? 'bg-white shadow-md' 
                          : 'bg-gray-100'
                      }`}>
                        {selectedStyle === style.value && (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processImage}
              disabled={!selectedImage || isProcessing}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all duration-300 ${
                !selectedImage || isProcessing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Your Masterpiece...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>✨ Transform to {styleOptions.find(s => s.value === selectedStyle)?.label}</span>
                </div>
              )}
            </button>
            
            {selectedImage && !isProcessing && (
              <button
                onClick={resetApp}
                className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              >
                🔄 Start Over
              </button>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processing Status */}
            {isProcessing && (
              <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Creating Your Masterpiece</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Applying {styleOptions.find(s => s.value === selectedStyle)?.label} artistic style...
                    </p>
                  </div>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                </div>
                <p className="text-gray-500 text-xs mt-3 text-center">This may take a few moments depending on image size</p>
              </div>
            )}

            {/* Processing Error */}
            {processingError && !isProcessing && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200 animate-fade-in">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">Processing Failed</h3>
                    <p className="text-red-700 text-sm mb-4">{processingError}</p>
                    <button
                      onClick={() => setProcessingError(null)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message */}
            {!imagePreview && !isProcessing && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Transform Your Photos into Art</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Upload an image to get started. Our AI will transform it into a stunning artistic masterpiece using neural style transfer.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  {[
                    { icon: '🎨', label: 'Multiple Styles', desc: 'Choose from 3 art styles' },
                    { icon: '⚡', label: 'Fast Processing', desc: 'Results in seconds' },
                    { icon: '🔒', label: '100% Private', desc: 'Runs in your browser' }
                  ].map((feature, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-3xl mb-2">{feature.icon}</div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">{feature.label}</p>
                      <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images Grid */}
            {(imagePreview || processedImage) && !isProcessing && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Image */}
                {imagePreview && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">📷 Original Image</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {(selectedImage!.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <div className="relative group overflow-hidden rounded-xl">
                      <img
                        src={imagePreview}
                        alt="Original"
                        className="w-full rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                )}

                {/* Processed Image */}
                {processedImage && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">✨ Stylized Result</h3>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `ai-style-transfer-${selectedStyle}.png`;
                          link.href = processedImage;
                          link.click();
                        }}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </div>
                    <div className="relative group overflow-hidden rounded-xl">
                      <img
                        src={processedImage}
                        alt="Stylized"
                        className="w-full rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        {styleOptions.find(s => s.value === selectedStyle)?.label} Style
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {processedImage && !isProcessing && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Transformation Complete!</p>
                    <p className="text-sm text-green-700">Your artistic masterpiece is ready to download</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}