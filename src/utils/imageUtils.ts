/**
 * Utilities for image compression and timestamp watermarking
 */

interface WatermarkOptions {
  restaurantName?: string;
  sectorName?: string;
  taskTitle?: string;
  staffName?: string;
  quality?: 'low' | 'medium' | 'high';
  applyWatermark?: boolean;
}

export async function processAndWatermarkImage(
  imageSource: File | Blob | HTMLVideoElement | string,
  options: WatermarkOptions = {}
): Promise<{ dataUrl: string; timestamp: string }> {
  const {
    restaurantName = 'Restaurante',
    sectorName = '',
    taskTitle = '',
    staffName = '',
    quality = 'medium',
    applyWatermark = true,
  } = options;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const fullTimestamp = `${dateFormatted} às ${timeFormatted}`;

  // Max dimension based on quality setting
  const maxDim = quality === 'low' ? 900 : quality === 'medium' ? 1280 : 1800;
  const jpegQuality = quality === 'low' ? 0.65 : quality === 'medium' ? 0.8 : 0.9;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    const processLoadedImage = (img: HTMLImageElement | HTMLVideoElement) => {
      let width = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
      let height = img instanceof HTMLVideoElement ? img.videoHeight : img.height;

      if (width === 0 || height === 0) {
        width = 1280;
        height = 720;
      }

      // Calculate scaled dimensions
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw Watermark Overlay if enabled
      if (applyWatermark) {
        const barHeight = Math.max(70, Math.round(height * 0.12));
        const padding = Math.max(12, Math.round(width * 0.02));

        // Dark gradient at the bottom for ultra clear legibility
        const gradient = ctx.createLinearGradient(0, height - barHeight - 20, 0, height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
        gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.75)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - barHeight - 20, width, barHeight + 20);

        // Watermark text styling
        const mainFontSize = Math.max(14, Math.round(width * 0.024));
        const subFontSize = Math.max(11, Math.round(width * 0.018));

        // Line 1: Check Icon + Restaurant & Sector & Timestamp
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${mainFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const line1 = `✓ COMPROVAÇÃO: ${sectorName.toUpperCase()} | ${restaurantName}`;
        ctx.fillText(line1, padding, height - barHeight + mainFontSize);

        // Line 2: Task title
        ctx.fillStyle = '#E2E8F0';
        ctx.font = `600 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const truncatedTask = taskTitle.length > 60 ? taskTitle.substring(0, 57) + '...' : taskTitle;
        ctx.fillText(`Tarefa: ${truncatedTask}`, padding, height - barHeight + mainFontSize + subFontSize + 8);

        // Line 3: Timestamp & Staff name
        ctx.fillStyle = '#38BDF8';
        ctx.font = `bold ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const staffInfo = staffName ? ` | Resp: ${staffName}` : '';
        ctx.fillText(`🕒 ${fullTimestamp}${staffInfo}`, padding, height - 12);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      resolve({
        dataUrl,
        timestamp: fullTimestamp,
      });
    };

    if (imageSource instanceof HTMLVideoElement) {
      processLoadedImage(imageSource);
    } else if (typeof imageSource === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processLoadedImage(img);
      img.onerror = (err) => reject(err);
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processLoadedImage(img);
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(imageSource);
    }
  });
}
