const colorCache: Record<string, string> = {};

export const getDominantColor = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        if (!imageUrl) {
            resolve(null);
            return;
        }

        if (colorCache[imageUrl]) {
            resolve(colorCache[imageUrl]);
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            // Basic check to avoid pure black/white if possible, might need more advanced logic
            if (r > 20 || g > 20 || b > 20) {
                 const color = `rgba(${r}, ${g}, ${b}, 1)`;
                 colorCache[imageUrl] = color;
                 resolve(color);
            } else {
                resolve(null); // Resolving null for very dark colors
            }
        };

        img.onerror = () => {
            resolve(null); // Could be CORS or other image load error
        };
        
        img.src = imageUrl;
    });
};
