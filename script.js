  const RAPIDAPI_KEY = 'YOUR_RAPIDAPI_KEY_HERE';
        const RAPIDAPI_HOST = 'instagram-scraper-api2.p.rapidapi.com';
        
        let currentMediaData = [];
        let currentMediaIndex = 0;

        function showMessage(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = `status-message ${type}`;
            
            if (type === 'success') {
                setTimeout(() => {
                    statusEl.className = 'status-message';
                }, 5000);
            }
        }

        function setButtonLoading(buttonId, textId, isLoading) {
            const btn = document.getElementById(buttonId);
            const text = document.getElementById(textId);
            
            if (isLoading) {
                btn.disabled = true;
                text.innerHTML = '<span class="loading"></span>';
            } else {
                btn.disabled = false;
                const buttonTexts = {
                    storyText: 'Check Story',
                    videoText: 'Check Video',
                    reelText: 'Check Reel'
                };
                text.textContent = buttonTexts[textId];
            }
        }

        function hideMedia() {
            document.getElementById('mediaContainer').classList.remove('show');
            currentMediaData = [];
        }

        function displayMedia(mediaList, type) {
            const container = document.getElementById('mediaContainer');
            const grid = document.getElementById('mediaGrid');
            const title = document.getElementById('mediaTitle');
            
            grid.innerHTML = '';
            
            if (mediaList.length === 0) {
                let message = '';
                if (type === 'story') {
                    message = '📭 No active stories available<br><small>This user has no current stories</small>';
                } else if (type === 'video') {
                    message = '📭 No videos available<br><small>No videos posted in the last week</small>';
                } else if (type === 'reel') {
                    message = '📭 No reels available<br><small>No reels posted in the last week</small>';
                }
                grid.innerHTML = `<div class="no-media-message">${message}</div>`;
                title.innerHTML = `${type.charAt(0).toUpperCase() + type.slice(1)}s <span class="media-count">(0)</span>`;
            } else {
                title.innerHTML = `${type.charAt(0).toUpperCase() + type.slice(1)}s <span class="media-count">(${mediaList.length})</span>`;
                
                mediaList.forEach((media, index) => {
                    const item = document.createElement('div');
                    item.className = 'media-item';
                    item.onclick = () => playMedia(index);
                    
                    const thumbnail = media.thumbnail || media.url;
                    const isVideo = media.type === 'video';
                    
                    item.innerHTML = `
                        <img src="${thumbnail}" alt="${type}" class="media-thumbnail" />
                        <div class="media-type-badge">${isVideo ? '▶️ Video' : '📷 Image'}</div>
                        ${media.date ? `<div class="media-date">${media.date}</div>` : ''}
                    `;
                    
                    grid.appendChild(item);
                });
            }
            
            container.classList.add('show');
        }

        function playMedia(index) {
            // Placeholder for playable media functionality
            const media = currentMediaData[index];
            showMessage(`Playing media ${index + 1}... (Playable feature coming next!)`, 'info');
        }

        async function checkContent(type) {
            // Check if API key is configured
            if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
                showMessage(
                    '⚠️ RapidAPI Key Not Configured!\n\n' +
                    'To use this feature:\n' +
                    '1. Sign up at RapidAPI.com\n' +
                    '2. Subscribe to "Instagram Scraper API"\n' +
                    '3. Replace YOUR_RAPIDAPI_KEY_HERE with your actual API key',
                    'error'
                );
                return;
            }

            // Prompt user for username/URL
            const input = prompt(`Enter Instagram username or ${type} URL:`);
            
            if (!input) {
                return;
            }

            const buttonMap = {
                story: { btn: 'storyBtn', text: 'storyText' },
                video: { btn: 'videoBtn', text: 'videoText' },
                reel: { btn: 'reelBtn', text: 'reelText' }
            };

            const { btn, text } = buttonMap[type];
            setButtonLoading(btn, text, true);
            showMessage(`Checking ${type}s...`, 'info');
            hideMedia();

            try {
                const mediaList = await fetchContent(input, type);
                currentMediaData = mediaList;
                displayMedia(mediaList, type);
                
                if (mediaList.length === 0) {
                    showMessage(`No ${type}s found for this user`, 'info');
                } else {
                    showMessage(`Found ${mediaList.length} ${type}(s) ✅`, 'success');
                }
            } catch (error) {
                showMessage(`Error: ${error.message}`, 'error');
                // Still show the media container with error message
                displayMedia([], type);
            } finally {
                setButtonLoading(btn, text, false);
            }
        }

        function extractUsername(input) {
            // Extract username from URL or use input as username
            if (input.includes('instagram.com')) {
                const patterns = [
                    /instagram\.com\/stories\/([^\/\?]+)/,
                    /instagram\.com\/([^\/\?]+)/
                ];
                
                for (const pattern of patterns) {
                    const match = input.match(pattern);
                    if (match && match[1] !== 'p' && match[1] !== 'reel' && match[1] !== 'tv') {
                        return match[1];
                    }
                }
            }
            return input.replace('@', '');
        }

        function formatDate(timestamp) {
            const date = new Date(timestamp * 1000);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        }

        function isWithinLastWeek(timestamp) {
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            return (timestamp * 1000) > weekAgo;
        }

        async function fetchContent(input, type) {
            const username = extractUsername(input);
            
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                }
            };

            let mediaList = [];

            if (type === 'story') {
                // Fetch stories
                const endpoint = `https://${RAPIDAPI_HOST}/v1/stories?username_or_id_or_url=${username}`;
                const response = await fetch(endpoint, options);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('User not found. Please check the username.');
                    } else if (response.status === 403) {
                        throw new Error('Access denied. User account may be private.');
                    }
                    throw new Error('Failed to fetch stories. User may not have active stories or account is private.');
                }

                const data = await response.json();
                
                if (!data.data || !data.data.items || data.data.items.length === 0) {
                    // Return empty array instead of throwing error
                    return [];
                }
                
                if (data.data && data.data.items) {
                    mediaList = data.data.items.map(item => ({
                        url: item.video_versions?.[0]?.url || item.image_versions2?.candidates?.[0]?.url,
                        thumbnail: item.image_versions2?.candidates?.[0]?.url,
                        type: item.video_versions ? 'video' : 'image',
                        date: formatDate(item.taken_at)
                    }));
                }
            } else {
                // Fetch user posts (videos and reels)
                const endpoint = `https://${RAPIDAPI_HOST}/v1/posts?username_or_id_or_url=${username}`;
                const response = await fetch(endpoint, options);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('User not found. Please check the username.');
                    } else if (response.status === 403) {
                        throw new Error('Access denied. User account may be private.');
                    }
                    throw new Error('Failed to fetch posts. User account may be private.');
                }

                const data = await response.json();
                
                if (!data.data || !data.data.items || data.data.items.length === 0) {
                    // Return empty array instead of throwing error
                    return [];
                }
                
                if (data.data && data.data.items) {
                    // Filter posts based on type and date (last week)
                    mediaList = data.data.items
                        .filter(item => {
                            const isWithinWeek = isWithinLastWeek(item.taken_at);
                            if (type === 'video') {
                                return isWithinWeek && item.video_url;
                            } else if (type === 'reel') {
                                return isWithinWeek && (item.product_type === 'clips' || item.media_type === 2);
                            }
                            return false;
                        })
                        .map(item => ({
                            url: item.video_url,
                            thumbnail: item.image_versions2?.candidates?.[0]?.url,
                            type: 'video',
                            date: formatDate(item.taken_at)
                        }));
                }
            }

            return mediaList;
        }