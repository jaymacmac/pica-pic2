
interface GitHubFile {
  name: string;
  type: string;
  download_url: string;
}

export const isGitHubUrl = (url: string): boolean => {
  return url.includes('github.com');
};

export const getImagesFromGitHub = async (url: string): Promise<string[]> => {
  try {
    // Basic parsing to handle:
    // 1. https://github.com/owner/repo
    // 2. https://github.com/owner/repo/tree/branch/path
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) return [];

    const owner = pathParts[0];
    const repo = pathParts[1];
    let path = '';
    let ref = ''; // branch

    // Check if it is a tree view
    if (pathParts[2] === 'tree') {
      ref = pathParts[3];
      path = pathParts.slice(4).join('/');
    }

    // Construct API URL
    let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    if (ref) {
      apiUrl += `?ref=${ref}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        // Fallback: If it's a blob URL (single file), convert to raw and return
        if (url.includes('/blob/')) {
            const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            return [rawUrl];
        }
        throw new Error('Failed to fetch from GitHub API');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      // It might be a single file object if the path pointed to a file
      if (data.type === 'file' && isImageFile(data.name)) {
        return [data.download_url];
      }
      return [];
    }

    // Filter for images
    const imageUrls = data
      .filter((file: GitHubFile) => file.type === 'file' && isImageFile(file.name))
      .map((file: GitHubFile) => file.download_url);

    return imageUrls;
  } catch (error) {
    console.error("GitHub fetch error:", error);
    // If API fails (e.g. rate limit), try to see if it's just a raw link needed
    if (url.includes('/blob/')) {
       return [url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')];
    }
    return [];
  }
};

const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
};

// --- Export / Upload Logic ---

export const convertUrlToBase64Simple = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const uploadImageToGitHub = async (
  token: string,
  owner: string,
  repo: string,
  path: string,
  fileName: string,
  base64Content: string
): Promise<void> => {
  // 1. Check if file exists to get SHA (needed for updates, though we mostly create new)
  // For simplicity in this viewer, we will attempt to create. If it exists, we might error or overwrite.
  // To keep it simple, we'll just try to PUT.
  
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path ? path + '/' : ''}${fileName}`;
  
  const body = {
    message: `Add ${fileName} via LuminaView`,
    content: base64Content,
  };

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to upload to GitHub');
  }
};
