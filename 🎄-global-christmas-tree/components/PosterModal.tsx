
import React, { useEffect, useState, useMemo } from 'react';
import { X, Download, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

interface PosterModalProps {
  onClose: () => void;
  userName: string;
  userMessage: string;
  canvasElement: HTMLCanvasElement | null;
}

export const PosterModal: React.FC<PosterModalProps> = ({ onClose, userName, userMessage, canvasElement }) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // 随机选择一个主题色，增强视觉多样性
  const themeColor = useMemo(() => {
    const colors = [
      '#FF0000', // 极致红
      '#00FF00', // 荧光绿
      '#FCD34D', // 温暖金
      '#3B82F6', // 科技蓝
      '#EC4899', // 浪漫粉
      '#FFFFFF'  // 极简白
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    const generatePoster = async () => {
      if (!canvasElement) return;

      const posterCanvas = document.createElement('canvas');
      const ctx = posterCanvas.getContext('2d');
      if (!ctx) return;

      // 1080x1920 高清海报尺寸 (9:16)
      posterCanvas.width = 1080;
      posterCanvas.height = 1920;

      // --- 1. 背景绘制 ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);

      // --- 2. 圣诞树截图处理 ---
      const screenshot = canvasElement.toDataURL('image/png');
      const treeImg = new Image();
      treeImg.crossOrigin = "anonymous";

      treeImg.onload = () => {
        const sidePadding = 80;
        const imgWidth = posterCanvas.width - (sidePadding * 2);
        const imgHeight = (imgWidth / canvasElement.width) * canvasElement.height;
        // 截图垂直居中稍偏上
        const imgY = 480;

        // 绘制截图
        ctx.save();
        // 增加一点截图的发光氛围
        ctx.shadowBlur = 60;
        ctx.shadowColor = themeColor + '33';
        ctx.drawImage(treeImg, sidePadding, imgY, imgWidth, imgHeight);
        ctx.restore();

        // --- 3. 巨型标题：复刻参考图的冲击感 ---
        ctx.fillStyle = themeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // "MERRY"
        ctx.font = '900 240px sans-serif'; 
        ctx.fillText('MERRY', posterCanvas.width / 2, 100);
        
        // "CHRISTMAS"
        ctx.font = '900 158px sans-serif';
        ctx.letterSpacing = "-6px";
        ctx.fillText('CHRISTMAS', posterCanvas.width / 2, 330);
        ctx.letterSpacing = "0px";

        // --- 4. 四角装饰排版 ---
        ctx.fillStyle = themeColor;
        ctx.font = 'bold 42px sans-serif';
        
        // 左上：年份
        ctx.textAlign = 'left';
        ctx.fillText('2025', 60, 60);
        
        // 右上：日期
        ctx.textAlign = 'right';
        ctx.fillText('1225', posterCanvas.width - 60, 60);

        // 左下：节日文字
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('聖誕', 60, posterCanvas.height - 100);
        ctx.fillText('快樂', 60, posterCanvas.height - 55);

        // 右下：对应数字装饰
        ctx.textAlign = 'right';
        ctx.fillText('十二', posterCanvas.width - 60, posterCanvas.height - 100);
        ctx.fillText('廿五', posterCanvas.width - 60, posterCanvas.height - 55);

        // --- 5. 核心用户信息区：模拟品牌设计 (防止溢出优化) ---
        const footerContentY = imgY + imgHeight + 80;
        
        // 用户名：大号加粗，带注册商标感
        ctx.textAlign = 'center';
        ctx.fillStyle = themeColor;
        ctx.font = 'bold 64px sans-serif';
        const displayAuthor = (userName || 'DESIGNER').toUpperCase();
        // 限制名字长度防止超出
        const truncatedName = displayAuthor.length > 20 ? displayAuthor.substring(0, 18) + '...' : displayAuthor;
        ctx.fillText(truncatedName + '®', posterCanvas.width / 2, footerContentY);

        // 祝福语：优雅换行排版
        ctx.fillStyle = '#FFFFFF';
        const rawMsg = (userMessage || "LIGHT UP THE WORLD WITH YOUR WISHES").toUpperCase();
        
        // 动态调整字体大小
        let fontSize = rawMsg.length > 50 ? 28 : 34;
        ctx.font = `italic 300 ${fontSize}px sans-serif`;
        
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let lines = 0;
          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
              lines++;
              if (lines >= 4) return; // 最多显示5行防止底部重叠
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, y);
        };
        
        // 设置绘制区域
        wrapText(rawMsg, posterCanvas.width / 2, footerContentY + 90, posterCanvas.width - 320, fontSize + 15);

        // --- 6. 二维码：微缩化并融入底部 ---
        const qrSize = 70; 
        const qrX = posterCanvas.width / 2 - qrSize / 2;
        const qrY = posterCanvas.height - 210;

        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        const qrColorHex = themeColor.replace('#', '');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(window.location.href)}&color=${qrColorHex}&bgcolor=000000`;
        
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          
          ctx.textAlign = 'center';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = themeColor;
          ctx.fillText('SCAN TO JOIN THE TREE', posterCanvas.width / 2, qrY + qrSize + 35);
          
          setPosterUrl(posterCanvas.toDataURL('image/png'));
          setIsGenerating(false);
        };
      };
      treeImg.src = screenshot;
    };

    generatePoster();
  }, [canvasElement, userName, userMessage, themeColor]);

  const handleDownload = () => {
    if (!posterUrl) return;
    const link = document.createElement('a');
    link.download = `Xmas_Poster_${userName || 'Guest'}.png`;
    link.href = posterUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl overflow-y-auto overflow-x-hidden animate-in fade-in duration-500">
      <div className="min-h-full w-full flex flex-col items-center py-10 px-6">
        
        {/* 顶部导航 */}
        <div className="w-full max-w-lg flex justify-between items-center mb-10">
           <button 
             onClick={onClose}
             className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold group"
           >
             <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10">
               <ArrowLeft size={20} />
             </div>
             <span className="text-[10px] tracking-[0.4em] uppercase">Return</span>
           </button>
           <div className="h-[1px] flex-1 mx-6 bg-white/10"></div>
           <div className="text-[9px] text-white/30 font-black tracking-widest uppercase">Art System v4.0</div>
        </div>

        {/* 海报预览卡片 (支持手机端完整显示) */}
        <div className="w-full max-w-md bg-black shadow-[0_40px_120px_rgba(0,0,0,1)] border border-white/5 flex flex-col relative rounded-sm overflow-hidden">
          <div className="relative aspect-[9/16] w-full bg-[#050505] flex items-center justify-center">
             {isGenerating ? (
               <div className="flex flex-col items-center gap-4">
                 <Loader2 size={32} className="animate-spin text-white/20" />
                 <span className="text-[9px] text-white/20 uppercase tracking-[0.5em]">Rendering Art...</span>
               </div>
             ) : (
               <div className="w-full h-full animate-in fade-in zoom-in-95 duration-1000">
                 <img src={posterUrl!} alt="Festive Poster" className="w-full h-full object-contain" />
               </div>
             )}
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="w-full max-w-md mt-10 flex flex-col gap-4">
           <button 
              onClick={handleDownload}
              disabled={isGenerating}
              style={{ borderColor: themeColor + '33' }}
              className="w-full py-5 bg-white text-black font-black text-xs tracking-[0.2em] rounded-full transition-all flex items-center justify-center gap-3 disabled:opacity-20 active:scale-95 shadow-xl"
           >
              <Download size={18} />
              <span>SAVE TO GALLERY</span>
           </button>
           
           <button 
              onClick={onClose}
              className="w-full py-4 text-white/20 hover:text-white transition-colors text-[9px] font-bold tracking-[0.4em] uppercase"
           >
              Dismiss
           </button>
        </div>

        {/* 滚动提示 (针对超长屏或小屏幕) */}
        <div className="mt-12 text-white/10 animate-pulse md:hidden">
           <Sparkles size={16} />
        </div>
      </div>
    </div>
  );
};
