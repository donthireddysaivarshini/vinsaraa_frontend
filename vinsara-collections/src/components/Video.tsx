import React, { useEffect, useState } from "react";
import { contentService } from "@/services/api";

const Video = () => {
  const [videoConfig, setVideoConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default hardcoded video ID (The one you had originally)
  const DEFAULT_YOUTUBE_ID = "qNKKSujit94";

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const data = await contentService.getVideoConfig();
        setVideoConfig(data);
      } catch (error) {
        console.error("Failed to fetch video config", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  // Helper to extract YouTube ID from various URL formats
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderVideoContent = () => {
    // 1. Check for File Upload from Backend
    if (videoConfig?.video_file) {
      return (
        <video
          className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
          controls
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoConfig.video_file} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // 2. Check for YouTube URL from Backend
    let videoId = DEFAULT_YOUTUBE_ID;
    
    if (videoConfig?.youtube_url) {
      const extractedId = getYouTubeId(videoConfig.youtube_url);
      if (extractedId) videoId = extractedId;
    }

    // 3. Render YouTube Iframe (Backend or Default)
    return (
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
        title={videoConfig?.title || "Video"}
        allow="autoplay; encrypted-media"
        allowFullScreen
      ></iframe>
    );
  };

  return (
    <section className="w-full py-8 md:py-12 lg:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Title / Description (Optional - remove if you only want the video) */}
        {videoConfig?.title && (
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight">{videoConfig.title}</h2>
                {videoConfig.description && (
                    <p className="mt-2 text-gray-600">{videoConfig.description}</p>
                )}
            </div>
        )}

        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-2xl bg-black">
          {!loading && renderVideoContent()}
        </div>
      </div>
    </section>
  );
};

export default Video;