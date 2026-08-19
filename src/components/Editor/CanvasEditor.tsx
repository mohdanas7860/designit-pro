'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import { removeBackground } from '@imgly/background-removal';
import {
    Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus, Star,
    Type, ImagePlus, LayoutTemplate, Layers as LayersIcon, AlignLeft, AlignCenter,
    AlignRight, ArrowUpToLine, ArrowDownToLine, Bold, Italic, Undo2, Redo2,
    Download, ZoomIn, ZoomOut, Maximize, Home, Plus, Search, Copy, Trash2,
    Eye, EyeOff, Sparkles, FileImage, FileJson, Image as ImageIcon, Wand2,
    Frame, PanelTop, Grid, Scissors, FileText, Loader2, PlusCircle, MinusCircle,
    ChevronUp, ChevronDown, ArrowLeft, Printer, Palette, Crop, Check, RefreshCw, X,
    Wallpaper, User, Save, Cloud, MousePointer2
} from 'lucide-react';
import AuthModal from '@/components/Auth/AuthModal';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PageData {
    id: string;
    name: string;
    json: any;
    backgroundColor: string;
}

export default function CanvasEditor() {
    // ── Navigation State ─────────────────────────────────────────────────────
    const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'passport-studio'>('dashboard');
    const [dashboardTab, setDashboardTab] = useState<'home' | 'templates' | 'projects'>('home');
    const [searchQuery, setSearchQuery] = useState('');

    // ── Auth & Persistence State ─────────────────────────────────────────────
    const [authUser, setAuthUser] = useState<any>(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // ── Collaboration State ──────────────────────────────────────────────────
    const socketRef = useRef<Socket | null>(null);
    const [activeCursors, setActiveCursors] = useState<{ [id: string]: any }>({});
    const isSocketUpdate = useRef(false);

    useEffect(() => {
        const saved = localStorage.getItem('designit_user');
        if (saved) setAuthUser(JSON.parse(saved));

        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        }
    }, []);

    useEffect(() => {
        if (!socketRef.current || !currentProjectId) return;
        socketRef.current.emit('join-project', currentProjectId, authUser);

        socketRef.current.on('cursor-update', (data) => {
            setActiveCursors(prev => ({ ...prev, [data.socketId]: data }));
        });

        socketRef.current.on('user-left', (id) => {
            setActiveCursors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        });

        socketRef.current.on('object-modified-sync', (state) => {
            if (!fabricCanvasRef.current) return;
            isSocketUpdate.current = true;
            fabricCanvasRef.current.loadFromJSON(state).then(() => {
                fabricCanvasRef.current.renderAll();
                isSocketUpdate.current = false;
                syncState();
            });
        });

        return () => {
            socketRef.current?.off('cursor-update');
            socketRef.current?.off('user-left');
            socketRef.current?.off('object-modified-sync');
        };
    }, [currentProjectId, authUser]);

    const handleCanvasMouseMove = useCallback((e: any) => {
        if (!currentProjectId || !socketRef.current || currentView !== 'editor') return;
        const pointer = fabricCanvasRef.current?.getPointer(e.e);
        if (pointer) {
            socketRef.current.emit('cursor-move', {
                projectId: currentProjectId,
                cursor: { x: pointer.x, y: pointer.y },
                user: authUser
            });
        }
    }, [currentProjectId, authUser, currentView]);


    // ── General Canvas Editor State ──────────────────────────────────────────
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const historyList = useRef<string[]>([]);
    const historyIndex = useRef<number>(-1);
    const isInHistory = useRef(false);
    const clipboard = useRef<any>(null);

    const [canvasWidth, setCanvasWidth] = useState(1080);
    const [canvasHeight, setCanvasHeight] = useState(1080);
    const [zoomRatio, setZoomRatio] = useState(0.5);
    const [activePreset, setActivePreset] = useState('IG');
    const [activeTab, setActiveTab] = useState('elements');
    const [exportOpen, setExportOpen] = useState(false);
    const [activeObject, setActiveObject] = useState<any>(null);
    const [layers, setLayers] = useState<any[]>([]);
    const [isRemovingBgEditor, setIsRemovingBgEditor] = useState(false);

    // Editor Adjust & Crop
    const [editorBrightness, setEditorBrightness] = useState(0);
    const [editorContrast, setEditorContrast] = useState(0);
    const [editorSaturation, setEditorSaturation] = useState(0);
    const [isCroppingEditor, setIsCroppingEditor] = useState(false);
    const targetCropImageRef = useRef<any>(null);

    const [pages, setPages] = useState<PageData[]>([
        { id: 'page-1', name: 'Page 1', json: null, backgroundColor: '#ffffff' }
    ]);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [gradColor1, setGradColor1] = useState('#6366f1');
    const [gradColor2, setGradColor2] = useState('#ec4899');
    const [gradAngle, setGradAngle] = useState(45);

    // ── Dedicated Passport Studio State ──────────────────────────────────────
    const passportCanvasElRef = useRef<HTMLCanvasElement | null>(null);
    const passportFabricCanvasRef = useRef<any>(null);
    const passportWrapperRef = useRef<HTMLDivElement | null>(null);
    const passportFileInputRef = useRef<HTMLInputElement | null>(null);

    const [passportStudioMode, setPassportStudioMode] = useState<'edit' | 'sheet'>('edit');
    const [passportSourceUrl, setPassportSourceUrl] = useState<string | null>(null);
    const [passportAdjustedImgData, setPassportAdjustedImgData] = useState<string | null>(null);

    const [passportPaperSize, setPassportPaperSize] = useState<'A4' | '4x6' | 'single'>('A4');
    const [passportCount, setPassportCount] = useState<number>(42);
    const [passportBgColor, setPassportBgColor] = useState<string>('transparent');
    const [borderStroke, setBorderStroke] = useState<boolean>(true);
    const [isRemovingBgPassport, setIsRemovingBgPassport] = useState(false);
    const [passportZoomRatio, setPassportZoomRatio] = useState(0.45);

    // Single Photo Adjustments
    const [passportBrightness, setPassportBrightness] = useState(0);
    const [passportContrast, setPassportContrast] = useState(0);
    const [passportSaturation, setPassportSaturation] = useState(0);
    const [isCroppingPassport, setIsCroppingPassport] = useState(false);

    // Grid Dimensions
    const passportDimensions = {
        'A4': {
            width: 1240,
            height: 1754,
            max: 42,
            cols: 6,
            pW: 176,
            pH: 224,
            startX: 52,
            startY: 56,
            gapX: 18,
            gapY: 18
        },
        '4x6': {
            width: 1200,
            height: 1800,
            max: 8,
            cols: 2,
            pW: 480,
            pH: 600,
            startX: 80,
            startY: 90,
            gapX: 60,
            gapY: 60
        },
        'single': {
            width: 600,
            height: 800,
            max: 1,
            cols: 1,
            pW: 440,
            pH: 560,
            startX: 80,
            startY: 120,
            gapX: 0,
            gapY: 0
        }
    };

    // Background Palette & Wallpapers for Canvas Editor
    const bgColorsList = [
        '#ffffff', '#000000', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1',
        '#fee2e2', '#fef3c7', '#dcfce7', '#e0e7ff', '#fae8ff', '#fce7f3',
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
        '#6366f1', '#8b5cf6', '#ec4899', '#1e293b', '#0f172a', '#18181b'
    ];

    const bgStockWallpapers = [
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=600',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
    ];

    // ── Independent Image Crop Functions ─────────────────────────────────────
    const startIndependentImageCrop = (c: any) => {
        if (!c) return;
        const activeImg = c.getActiveObject();
        if (!activeImg || (activeImg.type !== 'image' && activeImg.type !== 'FabricImage')) {
            alert('Pehle crop karne ke liye image select karein!');
            return;
        }

        targetCropImageRef.current = activeImg;
        const existing = c.getObjects().find((o: any) => o.name === 'cropBox');
        if (existing) c.remove(existing);

        const bounds = activeImg.getBoundingRect();
        const cropBox = new (fabric as any).Rect({
            name: 'cropBox',
            left: bounds.left + bounds.width * 0.1,
            top: bounds.top + bounds.height * 0.1,
            width: bounds.width * 0.8,
            height: bounds.height * 0.8,
            fill: 'rgba(99, 102, 241, 0.25)',
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDashArray: [6, 6],
            cornerColor: '#ffffff',
            cornerStrokeColor: '#6366f1',
            cornerSize: 12,
            transparentCorners: false,
            hasRotatingPoint: false
        });

        c.add(cropBox);
        c.setActiveObject(cropBox);
        c.renderAll();
    };

    const cancelIndependentCrop = (c: any, onFinish: () => void) => {
        if (!c) return;
        const cropBox = c.getObjects().find((o: any) => o.name === 'cropBox');
        if (cropBox) c.remove(cropBox);
        c.renderAll();
        targetCropImageRef.current = null;
        onFinish();
    };

    const applyIndependentCrop = (c: any, onFinish: (croppedUrl?: string) => void) => {
        if (!c) return;
        const cropBox = c.getObjects().find((o: any) => o.name === 'cropBox');
        const targetImg = targetCropImageRef.current || c.getObjects().find((o: any) => (o.type === 'image' || o.type === 'FabricImage') && o.name !== 'cropBox');

        if (!cropBox || !targetImg) {
            onFinish();
            return;
        }

        const imgElement = targetImg._element || targetImg.getElement?.();
        if (!imgElement) {
            onFinish();
            return;
        }

        const imgBounds = targetImg.getBoundingRect();
        const boxBounds = cropBox.getBoundingRect();

        const scaleX = (imgElement.naturalWidth || imgElement.width) / imgBounds.width;
        const scaleY = (imgElement.naturalHeight || imgElement.height) / imgBounds.height;

        const cropX = Math.max(0, (boxBounds.left - imgBounds.left) * scaleX);
        const cropY = Math.max(0, (boxBounds.top - imgBounds.top) * scaleY);
        const cropW = Math.min((imgElement.naturalWidth || imgElement.width) - cropX, boxBounds.width * scaleX);
        const cropH = Math.min((imgElement.naturalHeight || imgElement.height) - cropY, boxBounds.height * scaleY);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, cropW);
        tempCanvas.height = Math.max(1, cropH);
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
            tempCtx.drawImage(imgElement, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        }

        const croppedDataUrl = tempCanvas.toDataURL('image/png');
        c.remove(cropBox);

        const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.src = croppedDataUrl;

        newImg.onload = () => {
            const finalFabricImg = new ImageClass(newImg, {
                left: boxBounds.left + boxBounds.width / 2,
                top: boxBounds.top + boxBounds.height / 2,
                originX: 'center',
                originY: 'center',
                scaleX: boxBounds.width / cropW,
                scaleY: boxBounds.height / cropH,
            });

            c.remove(targetImg);
            c.add(finalFabricImg);
            c.setActiveObject(finalFabricImg);
            c.renderAll();
            targetCropImageRef.current = null;
            onFinish(croppedDataUrl);
        };
    };

    // ── Single Photo Staging Logic in Passport Studio ────────────────────────
    const setupSinglePhotoCanvas = useCallback(() => {
        if (!passportFabricCanvasRef.current) return;
        const c = passportFabricCanvasRef.current;
        c.setDimensions({ width: 700, height: 900 });
        c.clear();
        c.backgroundColor = '#ffffff';

        const imgToLoad = passportAdjustedImgData || passportSourceUrl;
        if (!imgToLoad) {
            c.renderAll();
            return;
        }

        const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgToLoad;
        img.onload = () => {
            const fabricImg = new ImageClass(img, {
                left: 350,
                top: 450,
                originX: 'center',
                originY: 'center',
                backgroundColor: passportBgColor !== 'transparent' ? passportBgColor : undefined,
            });
            const scale = Math.min(500 / Math.max(img.naturalWidth, 1), 650 / Math.max(img.naturalHeight, 1));
            fabricImg.set({ scaleX: scale, scaleY: scale });
            c.add(fabricImg);
            c.setActiveObject(fabricImg);
            c.renderAll();
            c.requestRenderAll();
        };
    }, [passportSourceUrl, passportAdjustedImgData, passportBgColor]);

    // ── Multi-Photo Grid Rendering ───────────────────────────────────────────
    const renderPassportSheetGrid = useCallback((forcedImgData?: string) => {
        if (!passportFabricCanvasRef.current) return;
        const c = passportFabricCanvasRef.current;
        const config = passportDimensions[passportPaperSize];

        c.setDimensions({ width: config.width, height: config.height });
        c.clear();
        c.backgroundColor = '#ffffff';

        const imageSourceToUse = forcedImgData || passportAdjustedImgData || passportSourceUrl;
        if (!imageSourceToUse) {
            c.renderAll();
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSourceToUse;

        img.onload = () => {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = config.pW * 2;
            tileCanvas.height = config.pH * 2;
            const ctx = tileCanvas.getContext('2d');

            if (ctx) {
                if (passportBgColor !== 'transparent') {
                    ctx.fillStyle = passportBgColor;
                    ctx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
                }

                ctx.drawImage(img, 0, 0, tileCanvas.width, tileCanvas.height);

                if (borderStroke) {
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(1.5, 1.5, tileCanvas.width - 3, tileCanvas.height - 3);
                }
            }

            const tileDataUrl = tileCanvas.toDataURL('image/png');
            const tileImg = new Image();
            tileImg.src = tileDataUrl;

            tileImg.onload = () => {
                const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
                const count = passportPaperSize === 'single' ? 1 : Math.min(passportCount, config.max);

                for (let i = 0; i < count; i++) {
                    const col = i % config.cols;
                    const row = Math.floor(i / config.cols);

                    const photo = new ImageClass(tileImg, {
                        left: config.startX + col * (config.pW + config.gapX),
                        top: config.startY + row * (config.pH + config.gapY),
                        scaleX: config.pW / tileImg.width,
                        scaleY: config.pH / tileImg.height,
                        selectable: true,
                    });

                    c.add(photo);
                }
                c.renderAll();
            };
        };
    }, [passportPaperSize, passportCount, passportAdjustedImgData, passportSourceUrl, borderStroke, passportBgColor]);

    // Initialize Passport Studio Canvas
    useEffect(() => {
        if (currentView !== 'passport-studio') return;

        const timer = setTimeout(() => {
            if (!passportCanvasElRef.current) return;
            if (passportFabricCanvasRef.current) {
                try { passportFabricCanvasRef.current.dispose(); } catch (_) { }
                passportFabricCanvasRef.current = null;
            }

            const canvas = new (fabric as any).Canvas(passportCanvasElRef.current, {
                width: passportStudioMode === 'edit' ? 700 : passportDimensions[passportPaperSize].width,
                height: passportStudioMode === 'edit' ? 900 : passportDimensions[passportPaperSize].height,
                backgroundColor: '#ffffff',
                preserveObjectStacking: true,
            });
            passportFabricCanvasRef.current = canvas;

            if (passportStudioMode === 'edit') {
                setupSinglePhotoCanvas();
            } else {
                renderPassportSheetGrid();
            }
        }, 50);

        return () => {
            clearTimeout(timer);
            if (passportFabricCanvasRef.current) {
                try { passportFabricCanvasRef.current.dispose(); } catch (_) { }
                passportFabricCanvasRef.current = null;
            }
        };
    }, [currentView, passportStudioMode, passportPaperSize]);

    // Re-render passport grid on slider/option change
    useEffect(() => {
        if (currentView === 'passport-studio' && passportStudioMode === 'sheet') {
            renderPassportSheetGrid();
        }
    }, [passportCount, borderStroke, passportBgColor, renderPassportSheetGrid, passportStudioMode, currentView]);

    // Auto-scale passport viewport
    useEffect(() => {
        if (currentView !== 'passport-studio' || !passportWrapperRef.current) return;
        const el = passportWrapperRef.current;
        const targetWidth = passportStudioMode === 'edit' ? 700 : passportDimensions[passportPaperSize].width;
        const targetHeight = passportStudioMode === 'edit' ? 900 : passportDimensions[passportPaperSize].height;

        const obs = new ResizeObserver(entries => {
            if (!entries || !entries[0]) return;
            const { width, height } = entries[0].contentRect;
            const sx = (width - 80) / targetWidth;
            const sy = (height - 80) / targetHeight;
            setPassportZoomRatio(Math.min(sx, sy, 1));
        });
        obs.observe(el);
        const { width, height } = el.getBoundingClientRect();
        const sx = (width - 80) / targetWidth;
        const sy = (height - 80) / targetHeight;
        setPassportZoomRatio(Math.min(sx, sy, 1));
        return () => obs.disconnect();
    }, [currentView, passportStudioMode, passportPaperSize]);

    // Image filter applicator
    const applyFilterToCanvasImage = (fabricCanvas: any, filterType: 'Brightness' | 'Contrast' | 'Saturation', value: number) => {
        const obj = fabricCanvas?.getActiveObject() || fabricCanvas?.getObjects().find((o: any) => o.type === 'image' || o.type === 'FabricImage');
        if (!obj) return;

        if (!obj.filters) obj.filters = [];
        obj.filters = obj.filters.filter((f: any) => f.type !== filterType);

        if (filterType === 'Brightness') {
            obj.filters.push(new (fabric as any).filters.Brightness({ brightness: value / 100 }));
        } else if (filterType === 'Contrast') {
            obj.filters.push(new (fabric as any).filters.Contrast({ contrast: value / 100 }));
        } else if (filterType === 'Saturation') {
            obj.filters.push(new (fabric as any).filters.Saturation({ saturation: value / 100 }));
        }

        if (obj.applyFilters) obj.applyFilters();
        fabricCanvas?.requestRenderAll();
    };

    // Auto 3.5cm x 4.5cm crop
    const applyAutoPassportCrop = () => {
        const c = passportFabricCanvasRef.current;
        if (!c) return;
        const obj = c.getActiveObject() || c.getObjects().find((o: any) => o.type === 'image' || o.type === 'FabricImage');
        if (!obj) return;

        const targetRatio = 3.5 / 4.5;
        let cropWidth = obj.width;
        let cropHeight = obj.width / targetRatio;

        if (cropHeight > obj.height) {
            cropHeight = obj.height;
            cropWidth = obj.height * targetRatio;
        }

        obj.set({
            cropX: (obj.width - cropWidth) / 2,
            cropY: (obj.height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
        });

        c.renderAll();
    };

    // Generate Final Sheet Action
    const handleGeneratePassportGrid = (count: number) => {
        const c = passportFabricCanvasRef.current;
        if (!c) return;

        const cropBox = c.getObjects().find((o: any) => o.name === 'cropBox');
        if (cropBox) c.remove(cropBox);

        const imgObj = c.getObjects().find((o: any) => o.type === 'image' || o.type === 'FabricImage');
        let tightPhotoData = passportSourceUrl;

        if (imgObj) {
            tightPhotoData = imgObj.toDataURL({ format: 'png', multiplier: 2 });
        }

        setPassportAdjustedImgData(tightPhotoData);
        setPassportCount(count);
        setIsCroppingPassport(false);
        setPassportStudioMode('sheet');
        renderPassportSheetGrid(tightPhotoData || undefined);
    };

    // Passport Photo Upload
    const handlePassportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;
            setPassportSourceUrl(url);
            setPassportAdjustedImgData(null);
            setIsCroppingPassport(false);
            setPassportStudioMode('edit');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Clear / Remove Photo Action
    const handleClearPassportPhoto = () => {
        setPassportSourceUrl(null);
        setPassportAdjustedImgData(null);
        setIsCroppingPassport(false);
        setPassportStudioMode('edit');
        if (passportFabricCanvasRef.current) {
            passportFabricCanvasRef.current.clear();
            passportFabricCanvasRef.current.backgroundColor = '#ffffff';
            passportFabricCanvasRef.current.renderAll();
        }
    };

    // ── Dedicated Passport AI BG Removal (Error Fixed) ──────────────────────
    const handlePassportBgRemove = async () => {
        const c = passportFabricCanvasRef.current;
        const activeImg = c?.getActiveObject() || c?.getObjects().find((o: any) => o.type === 'image' || o.type === 'FabricImage');

        let sourceUrl = passportSourceUrl;
        if (activeImg) {
            sourceUrl = activeImg.toDataURL({ format: 'png', multiplier: 1 });
        }

        if (!sourceUrl) {
            alert('Pehle customer photo upload karein!');
            return;
        }

        try {
            setIsRemovingBgPassport(true);
            const res = await fetch(sourceUrl);
            const blobInput = await res.blob();

            const resultBlob = await removeBackground(blobInput);
            const newUrl = URL.createObjectURL(resultBlob);

            setPassportSourceUrl(newUrl);
            setPassportAdjustedImgData(newUrl);
            setIsRemovingBgPassport(false);

            if (c) {
                c.clear();
                c.backgroundColor = '#ffffff';
                const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = newUrl;
                img.onload = () => {
                    const fabricImg = new ImageClass(img, {
                        left: 350,
                        top: 450,
                        originX: 'center',
                        originY: 'center',
                        backgroundColor: passportBgColor !== 'transparent' ? passportBgColor : undefined,
                    });
                    const scale = Math.min(500 / Math.max(img.naturalWidth, 1), 650 / Math.max(img.naturalHeight, 1));
                    fabricImg.set({ scaleX: scale, scaleY: scale });
                    c.add(fabricImg);
                    c.setActiveObject(fabricImg);
                    c.renderAll();
                };
            }
        } catch (err) {
            console.error('BG removal error:', err);
            setIsRemovingBgPassport(false);
            alert('Background remove karne mein dikkat aayi.');
        }
    };

    // Passport Export Actions
    const exportPassportPDF = () => {
        const c = passportFabricCanvasRef.current;
        if (!c) return;

        const config = passportDimensions[passportPaperSize];
        const pdf = new jsPDF({
            orientation: config.width > config.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [config.width, config.height],
        });

        const imgData = c.toDataURL({ multiplier: 2, format: 'jpeg', quality: 0.98 });
        pdf.addImage(imgData, 'JPEG', 0, 0, config.width, config.height);
        pdf.save(`passport-sheet-${passportPaperSize.toLowerCase()}.pdf`);
    };

    const exportPassportPNG = () => {
        const c = passportFabricCanvasRef.current;
        if (!c) return;
        const a = document.createElement('a');
        a.download = `passport-sheet-${passportPaperSize.toLowerCase()}.png`;
        a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        a.click();
    };

    // ── General Editor Canvas Setup & Event Sync ─────────────────────────────
    const syncState = useCallback(() => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const active = c.getActiveObject() ?? null;
        setActiveObject(active);
        setLayers([...c.getObjects()].reverse());
    }, []);

    const pushHistory = useCallback(() => {
        const c = fabricCanvasRef.current;
        if (!c || isInHistory.current) return;
        const json = JSON.stringify(c.toJSON());
        if (historyList.current[historyIndex.current] === json) return;
        historyList.current = historyList.current.slice(0, historyIndex.current + 1);
        historyList.current.push(json);
        historyIndex.current = historyList.current.length - 1;

        if (socketRef.current && currentProjectId && !isSocketUpdate.current) {
            socketRef.current.emit('object-modified', { projectId: currentProjectId, state: c.toJSON() });
        }
    }, [currentProjectId]);

    const addObj = useCallback((obj: any) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        c.add(obj);
        c.setActiveObject(obj);
        c.renderAll();
        pushHistory();
        syncState();
    }, [pushHistory, syncState]);

    const undo = useCallback(() => {
        const c = fabricCanvasRef.current;
        if (!c || historyIndex.current <= 0) return;
        isInHistory.current = true;
        historyIndex.current -= 1;
        c.loadFromJSON(historyList.current[historyIndex.current]).then(() => {
            c.backgroundColor = '#ffffff';
            c.renderAll();
            isInHistory.current = false;
            syncState();
        });
    }, [syncState]);

    const redo = useCallback(() => {
        const c = fabricCanvasRef.current;
        if (!c || historyIndex.current >= historyList.current.length - 1) return;
        isInHistory.current = true;
        historyIndex.current += 1;
        c.loadFromJSON(historyList.current[historyIndex.current]).then(() => {
            c.backgroundColor = '#ffffff';
            c.renderAll();
            isInHistory.current = false;
            syncState();
        });
    }, [syncState]);

    const copy = useCallback(async () => {
        const activeC = currentView === 'passport-studio' ? passportFabricCanvasRef.current : fabricCanvasRef.current;
        const obj = activeC?.getActiveObject();
        if (!obj) return;
        clipboard.current = await (obj as any).clone();
    }, [currentView]);

    const paste = useCallback(async () => {
        const activeC = currentView === 'passport-studio' ? passportFabricCanvasRef.current : fabricCanvasRef.current;
        if (!clipboard.current || !activeC) return;
        const cl = await (clipboard.current as any).clone();
        cl.set({ left: (cl.left ?? 0) + 20, top: (cl.top ?? 0) + 20 });
        if (currentView === 'passport-studio') {
            activeC.add(cl);
            activeC.setActiveObject(cl);
            activeC.renderAll();
        } else {
            addObj(cl);
        }
    }, [addObj, currentView]);

    const deleteSelected = useCallback(() => {
        const activeC = currentView === 'passport-studio' ? passportFabricCanvasRef.current : fabricCanvasRef.current;
        if (!activeC) return;
        const objs = activeC.getActiveObjects ? activeC.getActiveObjects() : [activeC.getActiveObject()].filter(Boolean);
        activeC.discardActiveObject();
        objs.forEach((o: any) => activeC.remove(o));
        activeC.renderAll();
        if (currentView === 'editor') {
            pushHistory();
            syncState();
        }
    }, [pushHistory, syncState, currentView]);

    // Universal Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeC = currentView === 'passport-studio' ? passportFabricCanvasRef.current : fabricCanvasRef.current;
            if (!activeC) return;

            const activeObj = activeC.getActiveObject();
            if (activeObj && (activeObj as any).isEditing) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                copy();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                paste();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                copy();
                deleteSelected();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteSelected();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            } else if (currentView === 'passport-studio' && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                setPassportCount(prev => Math.min(passportDimensions[passportPaperSize].max, prev + 1));
            } else if (currentView === 'passport-studio' && (e.key === '-' || e.key === '_')) {
                e.preventDefault();
                setPassportCount(prev => Math.max(1, prev - 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentView, copy, paste, deleteSelected, undo, redo, passportPaperSize]);

    // General Editor Canvas Init
    useEffect(() => {
        if (currentView !== 'editor') return;

        const timer = setTimeout(() => {
            if (!canvasElRef.current) return;
            if (fabricCanvasRef.current) {
                try { fabricCanvasRef.current.dispose(); } catch (_) { }
                fabricCanvasRef.current = null;
            }

            const canvas = new (fabric as any).Canvas(canvasElRef.current, {
                width: canvasWidth || 1080,
                height: canvasHeight || 1080,
                backgroundColor: '#ffffff',
                preserveObjectStacking: true,
            });
            fabricCanvasRef.current = canvas;

            const onModified = () => { pushHistory(); syncState(); };
            canvas.on('object:modified', onModified);
            canvas.on('object:added', syncState);
            canvas.on('object:removed', syncState);
            canvas.on('selection:created', syncState);
            canvas.on('selection:updated', syncState);
            canvas.on('selection:cleared', syncState);
            canvas.on('mouse:move', handleCanvasMouseMove);

            canvas.renderAll();
            setTimeout(() => pushHistory(), 100);
        }, 50);

        return () => {
            clearTimeout(timer);
            if (fabricCanvasRef.current) {
                try { fabricCanvasRef.current.dispose(); } catch (_) { }
                fabricCanvasRef.current = null;
            }
        };
    }, [currentView, canvasWidth, canvasHeight]);

    // Auto-scale editor viewport
    useEffect(() => {
        if (currentView !== 'editor' || !wrapperRef.current) return;
        const el = wrapperRef.current;
        const obs = new ResizeObserver(entries => {
            if (!entries || !entries[0]) return;
            const { width, height } = entries[0].contentRect;
            const sx = (width - 80) / (canvasWidth || 1080);
            const sy = (height - 80) / (canvasHeight || 1080);
            setZoomRatio(Math.min(sx, sy, 1));
        });
        obs.observe(el);
        const { width, height } = el.getBoundingClientRect();
        const sx = (width - 80) / (canvasWidth || 1080);
        const sy = (height - 80) / (canvasHeight || 1080);
        setZoomRatio(Math.min(sx, sy, 1));
        return () => obs.disconnect();
    }, [canvasWidth, canvasHeight, currentView]);

    // ── Smart Background Appliers for General Editor ─────────────────────────
    const applySmartBackground = (colorOrImgUrl: string, isImage: boolean = false) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const activeObj = c.getActiveObject() as any;

        if (activeObj && (activeObj.type === 'image' || activeObj.type === 'FabricImage')) {
            if (!isImage) {
                activeObj.set('backgroundColor', colorOrImgUrl);
            }
            c.renderAll();
            pushHistory();
            return;
        }

        if (!isImage) {
            c.backgroundImage = null;
            c.backgroundColor = colorOrImgUrl;
            c.renderAll();
            pushHistory();
        } else {
            const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
            ImageClass.fromURL(colorOrImgUrl, { crossOrigin: 'anonymous' }).then((img: any) => {
                img.scaleToWidth(c.width);
                c.backgroundImage = img;
                c.renderAll();
                pushHistory();
            });
        }
    };

    // ── Dedicated Editor AI BG Removal (Error Fixed) ────────────────────────
    const handleRemoveBackgroundEditor = async () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const activeObj = c.getActiveObject() as any;
        if (!activeObj || (activeObj.type !== 'image' && activeObj.type !== 'FabricImage')) {
            alert('Pehle canvas par koi photo select karo!');
            return;
        }

        try {
            setIsRemovingBgEditor(true);
            const dataUrl = activeObj.toDataURL({ format: 'png', multiplier: 1 });
            const res = await fetch(dataUrl);
            const blobInput = await res.blob();

            const resultBlob = await removeBackground(blobInput);
            const newUrl = URL.createObjectURL(resultBlob);

            const newImg = new Image();
            newImg.crossOrigin = 'anonymous';
            newImg.src = newUrl;
            newImg.onload = () => {
                const currentCanvas = fabricCanvasRef.current;
                if (!currentCanvas) return;

                const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
                const newFabricImg = new ImageClass(newImg, {
                    left: activeObj.left,
                    top: activeObj.top,
                    scaleX: activeObj.scaleX,
                    scaleY: activeObj.scaleY,
                    angle: activeObj.angle,
                    originX: activeObj.originX,
                    originY: activeObj.originY,
                });
                currentCanvas.remove(activeObj);
                currentCanvas.add(newFabricImg);
                currentCanvas.setActiveObject(newFabricImg);
                currentCanvas.renderAll();
                setIsRemovingBgEditor(false);
                pushHistory();
                syncState();
            };
        } catch (err) {
            console.error('BG removal error:', err);
            setIsRemovingBgEditor(false);
            alert('Background remove karne mein dikkat aayi.');
        }
    };

    // General Editor Tools & Shapes
    const applyPreset = (preset: string, w: number, h: number) => {
        const c = fabricCanvasRef.current;
        setActivePreset(preset);
        setCanvasWidth(w);
        setCanvasHeight(h);
        if (c) {
            c.setDimensions({ width: w, height: h });
            c.backgroundColor = '#ffffff';
            c.renderAll();
        }
        setCurrentView('editor');
    };

    const switchPage = async (targetIndex: number) => {
        const c = fabricCanvasRef.current;
        if (!c || targetIndex === activePageIndex) return;

        const updated = [...pages];
        updated[activePageIndex] = {
            ...updated[activePageIndex],
            json: c.toJSON(),
            backgroundColor: (c.backgroundColor as string) || '#ffffff',
        };
        setPages(updated);
        setActivePageIndex(targetIndex);

        const target = updated[targetIndex];
        if (target.json && Object.keys(target.json).length > 0) {
            await c.loadFromJSON(target.json);
            c.backgroundColor = target.backgroundColor;
        } else {
            c.clear();
            c.backgroundColor = target.backgroundColor;
        }
        c.renderAll();
        syncState();
    };

    const addPage = () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const updated = [...pages];
        updated[activePageIndex] = { ...updated[activePageIndex], json: c.toJSON(), backgroundColor: (c.backgroundColor as string) || '#ffffff' };
        const newPage: PageData = { id: `page-${Date.now()}`, name: `Page ${updated.length + 1}`, json: null, backgroundColor: '#ffffff' };
        setPages([...updated, newPage]);
        setActivePageIndex(updated.length);
        c.clear();
        c.backgroundColor = '#ffffff';
        c.renderAll();
        syncState();
    };

    const deletePage = (i: number) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, idx) => idx !== i);
        setPages(newPages);
        if (i === activePageIndex) switchPage(Math.max(0, i - 1));
    };

    const addRect = () => addObj(new (fabric as any).Rect({ left: canvasWidth / 2 - 75, top: canvasHeight / 2 - 75, width: 150, height: 150, fill: '#6366f1', rx: 8 }));
    const addCircle = () => addObj(new (fabric as any).Circle({ left: canvasWidth / 2 - 75, top: canvasHeight / 2 - 75, radius: 75, fill: '#ec4899' }));
    const addTriangle = () => addObj(new (fabric as any).Triangle({ left: canvasWidth / 2 - 60, top: canvasHeight / 2 - 60, width: 120, height: 120, fill: '#10b981' }));
    const addLine = () => addObj(new (fabric as any).Line([canvasWidth / 2 - 75, canvasHeight / 2, canvasWidth / 2 + 75, canvasHeight / 2], { stroke: '#f59e0b', strokeWidth: 5 }));
    const addStar = () => {
        const pts = Array.from({ length: 5 }, (_, i) => {
            const outerR = 60, innerR = 24, ang = (Math.PI / 2.5) * i - Math.PI / 2;
            const angInner = ang + Math.PI / 5;
            return [
                { x: Math.cos(ang) * outerR, y: Math.sin(ang) * outerR },
                { x: Math.cos(angInner) * innerR, y: Math.sin(angInner) * innerR },
            ];
        }).flat();
        addObj(new (fabric as any).Polygon(pts, { left: canvasWidth / 2, top: canvasHeight / 2, fill: '#f59e0b', originX: 'center', originY: 'center' }));
    };

    const addHeading = () => addObj(new (fabric as any).IText('Heading Text', { left: canvasWidth / 2 - 120, top: canvasHeight / 2 - 30, fontSize: 48, fontFamily: 'Inter, sans-serif', fill: '#0f172a', fontWeight: 'bold' }));
    const addSubheading = () => addObj(new (fabric as any).IText('Subheading', { left: canvasWidth / 2 - 80, top: canvasHeight / 2 - 15, fontSize: 24, fontFamily: 'Inter, sans-serif', fill: '#334155' }));
    const addBodyText = () => addObj(new (fabric as any).IText('Body text here...', { left: canvasWidth / 2 - 80, top: canvasHeight / 2 - 10, fontSize: 16, fontFamily: 'Inter, sans-serif', fill: '#64748b' }));

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvasRef.current) return;
        const c = fabricCanvasRef.current;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const imgEl = new Image();
            imgEl.src = ev.target?.result as string;
            imgEl.onload = () => {
                const scale = Math.min(400 / Math.max(imgEl.naturalWidth, 1), 1);
                const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
                const imgObj = new ImageClass(imgEl, {
                    left: c.width! / 2,
                    top: c.height! / 2,
                    scaleX: scale,
                    scaleY: scale,
                    originX: 'center',
                    originY: 'center',
                });
                addObj(imgObj);
            };
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const addStockPhoto = (url: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;
        ImageClass.fromURL(url, { crossOrigin: 'anonymous' }).then((img: any) => {
            if (img.scaleToWidth) {
                img.scaleToWidth(Math.min(400, c.width!));
            } else {
                img.scale(Math.min(400 / (img.width || 1), 1));
            }
            img.set({ left: c.width! / 2, top: c.height! / 2, originX: 'center', originY: 'center' });
            addObj(img);
        });
    };

    const stockPhotos = [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
        'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=400',
    ];

    const loadTemplate = (type: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        c.remove(...c.getObjects());
        c.backgroundColor = '#ffffff';
        const cx = c.width! / 2, cy = c.height! / 2;

        if (type === 'sale') {
            const bg = new (fabric as any).Rect({ left: 0, top: 0, width: c.width!, height: c.height!, selectable: false, fill: new (fabric as any).Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: c.width!, y2: c.height! }, colorStops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#db2777' }] }) });
            const title = new (fabric as any).IText('MEGA SALE', { left: cx, top: cy - 80, originX: 'center', originY: 'center', fontSize: 72, fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Inter', shadow: new (fabric as any).Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10 }) });
            const sub = new (fabric as any).IText('Up to 50% Off Everything', { left: cx, top: cy, originX: 'center', originY: 'center', fontSize: 28, fill: 'rgba(255,255,255,0.85)', fontFamily: 'Inter' });
            const btn = new (fabric as any).Rect({ left: cx, top: cy + 80, width: 200, height: 50, rx: 25, originX: 'center', originY: 'center', fill: '#ffffff' });
            const btnTxt = new (fabric as any).IText('SHOP NOW', { left: cx, top: cy + 80, originX: 'center', originY: 'center', fontSize: 18, fontWeight: 'bold', fill: '#7c3aed', fontFamily: 'Inter' });
            c.add(bg, title, sub, btn, btnTxt);
        } else if (type === 'quote') {
            const card = new (fabric as any).Rect({ left: cx, top: cy, width: Math.min(c.width! - 80, 700), height: Math.min(c.height! - 80, 500), rx: 20, originX: 'center', originY: 'center', fill: '#1e1b4b' });
            const q = new (fabric as any).IText('"Design is intelligence\nmade visible."', { left: cx, top: cy - 40, originX: 'center', originY: 'center', fontSize: 32, fontStyle: 'italic', fill: '#f1f5f9', fontFamily: 'Inter', textAlign: 'center' });
            const auth = new (fabric as any).IText('— Alina Wheeler', { left: cx, top: cy + 80, originX: 'center', originY: 'center', fontSize: 18, fill: '#94a3b8', fontFamily: 'Inter' });
            c.add(card, q, auth);
        } else if (type === 'promo') {
            const circle = new (fabric as any).Circle({ left: cx, top: cy, radius: Math.min(cx, cy) - 40, originX: 'center', originY: 'center', fill: '#0ea5e9', selectable: false });
            const t1 = new (fabric as any).IText('NEW ARRIVALS', { left: cx, top: cy - 50, originX: 'center', originY: 'center', fontSize: 44, fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Inter' });
            const t2 = new (fabric as any).IText('Summer Collection 2026', { left: cx, top: cy + 30, originX: 'center', originY: 'center', fontSize: 22, fill: '#bae6fd', fontFamily: 'Inter' });
            c.add(circle, t1, t2);
        }

        c.renderAll();
        pushHistory();
        syncState();
    };

    const setProp = (prop: string, val: any) => {
        const c = fabricCanvasRef.current;
        const obj = c?.getActiveObject();
        if (!obj || !c) return;
        obj.set(prop as any, val);
        c.renderAll();
        pushHistory();
    };
    const getProp = (prop: string, def: any = '') => (activeObject as any)?.[prop] ?? def;

    const alignObj = (dir: string) => {
        const c = fabricCanvasRef.current;
        const obj = c?.getActiveObject();
        if (!obj || !c) return;
        if (dir === 'left') obj.set('left', 0);
        if (dir === 'right') obj.set('left', c.width! - (obj.width! * (obj.scaleX ?? 1)));
        if (dir === 'center-h') obj.set('left', (c.width! - obj.width! * (obj.scaleX ?? 1)) / 2);
        if (dir === 'top') obj.set('top', 0);
        if (dir === 'bottom') obj.set('top', c.height! - (obj.height! * (obj.scaleY ?? 1)));
        if (dir === 'center-v') obj.set('top', (c.height! - obj.height! * (obj.scaleY ?? 1)) / 2);
        c.renderAll();
        pushHistory();
    };

    const toggleVisibility = (obj: any) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        obj.set('visible', !obj.visible);
        c.renderAll();
        syncState();
    };

    const applyGradient = () => {
        const c = fabricCanvasRef.current;
        const obj = c?.getActiveObject();
        if (!obj || !c) return;
        const w = obj.width ?? 100, h = obj.height ?? 100;
        const rad = (gradAngle * Math.PI) / 180;
        obj.set('fill', new (fabric as any).Gradient({ type: 'linear', coords: { x1: (1 - Math.cos(rad)) * w / 2, y1: (1 - Math.sin(rad)) * h / 2, x2: (1 + Math.cos(rad)) * w / 2, y2: (1 + Math.sin(rad)) * h / 2 }, colorStops: [{ offset: 0, color: gradColor1 }, { offset: 1, color: gradColor2 }] }));
        c.renderAll();
        pushHistory();
    };

    const exportPDF = async () => {
        const c = fabricCanvasRef.current;
        if (!c) return;

        const pdf = new jsPDF({
            orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvasWidth, canvasHeight],
        });

        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage([canvasWidth, canvasHeight]);
            let imgData = '';
            if (i === activePageIndex) {
                imgData = c.toDataURL({ multiplier: 2, format: 'jpeg', quality: 0.95 });
            } else {
                const dummyCanvas = document.createElement('canvas');
                const tempFabric = new (fabric as any).Canvas(dummyCanvas, { width: canvasWidth, height: canvasHeight });
                if (pages[i].json) await tempFabric.loadFromJSON(pages[i].json);
                imgData = tempFabric.toDataURL({ multiplier: 2, format: 'jpeg', quality: 0.95 });
                tempFabric.dispose();
            }

            if (imgData) {
                pdf.addImage(imgData, 'JPEG', 0, 0, canvasWidth, canvasHeight);
            }
        }
        pdf.save('designit-project.pdf');
    };

    const exportPNG = () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const a = document.createElement('a');
        a.download = 'designit-export.png';
        a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        a.click();
    };

    const exportSVG = () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const blob = new Blob([c.toSVG()], { type: 'image/svg+xml' });
        const a = Object.assign(document.createElement('a'), { download: 'designit.svg', href: URL.createObjectURL(blob) });
        a.click();
    };

    const exportJSON = () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const blob = new Blob([JSON.stringify(c.toJSON())], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { download: 'designit.json', href: URL.createObjectURL(blob) });
        a.click();
    };

    const presetCards = [
        { label: 'Instagram Post', sub: '1080 × 1080', key: 'IG', w: 1080, h: 1080, icon: '📸', color: 'from-pink-600 to-orange-500' },
        { label: 'YouTube Thumb', sub: '1280 × 720', key: 'YT', w: 1280, h: 720, icon: '🎬', color: 'from-red-600 to-rose-500' },
        { label: 'Mobile Story', sub: '1080 × 1920', key: 'Story', w: 1080, h: 1920, icon: '📱', color: 'from-purple-600 to-fuchsia-500' },
        { label: 'A4 Document', sub: '1240 × 1754', key: 'A4', w: 1240, h: 1754, icon: '📄', color: 'from-blue-600 to-cyan-500' },
        { label: 'Poster', sub: '800 × 1200', key: 'Poster', w: 800, h: 1200, icon: '🖼️', color: 'from-emerald-600 to-teal-500' },
        { label: 'Presentation', sub: '1920 × 1080', key: 'Pres', w: 1920, h: 1080, icon: '💼', color: 'from-amber-600 to-yellow-500' },
    ];
    const dashTemplates = [
        { key: 'sale', label: 'Sale Banner', thumb: 'from-purple-600 to-pink-600', icon: '🛍️' },
        { key: 'quote', label: 'Quote Card', thumb: 'from-slate-800 to-slate-600', icon: '💬' },
        { key: 'promo', label: 'Social Promo', thumb: 'from-sky-500 to-blue-600', icon: '✨' },
    ];

    // =========================================================================
    // VIEW 1: HOME DASHBOARD
    // =========================================================================
    if (currentView === 'dashboard') {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex relative font-sans">
                <nav className="w-64 bg-[#111118] border-r border-zinc-800 flex flex-col p-5 shrink-0">
                    <div className="flex items-center space-x-2 mb-8">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><PanelTop size={16} /></div>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">DesignIt Pro</span>
                    </div>
                    {(['home', 'templates', 'projects'] as const).map(tab => (
                        <button key={tab} onClick={() => setDashboardTab(tab)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg mb-1 font-medium text-sm transition-colors capitalize ${dashboardTab === tab ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8">
                        <div className="relative w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search templates..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-300" />
                        </div>
                        <div className="flex items-center gap-3">
                            {!authUser ? (
                                <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-1.5 text-zinc-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                                    <User size={15} /> Login / Sign Up
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-indigo-300 font-semibold shadow-sm">
                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">{authUser.name?.charAt(0) || authUser.email?.charAt(0)}</div>
                                    <span className="max-w-[100px] truncate">{authUser.name || authUser.email}</span>
                                    <button onClick={() => { localStorage.removeItem('designit_token'); localStorage.removeItem('designit_user'); setAuthUser(null); }} className="text-zinc-500 hover:text-red-400 ml-1"><X size={12} /></button>
                                </div>
                            )}
                            <div className="w-px h-5 bg-zinc-800 mx-1"></div>
                            <button onClick={() => setCurrentView('passport-studio')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-full font-semibold text-xs transition-all hover:scale-105 flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
                                <Scissors size={14} /> Open Passport Studio
                            </button>
                            <button onClick={() => setCurrentView('editor')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-indigo-900/30">
                                Open Canvas Editor →
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-8">
                        {dashboardTab === 'home' && (
                            <>
                                <h1 className="text-3xl font-bold mb-1">Start Creating</h1>
                                <p className="text-zinc-400 text-sm mb-6">Choose a canvas size, launch the dedicated passport maker, or pick a template.</p>

                                <div onClick={() => setCurrentView('passport-studio')} className="mb-8 p-6 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-zinc-900 border-2 border-indigo-500/50 hover:border-indigo-400 rounded-3xl cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between shadow-2xl">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40">
                                            <Scissors size={30} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                                                Professional Passport Photo Studio
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">FULL STUDIO</span>
                                            </h3>
                                            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">Single photo staging $\rightarrow$ Auto 3.5cm x 4.5cm crop $\rightarrow$ Manual crop & auto light enhance $\rightarrow$ 1-Click Generate 42 (A4) / 8 (4x6) print ready sheet.</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5">
                                        Launch Studio →
                                    </span>
                                </div>

                                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Canvas Sizes</h2>
                                <div className="grid grid-cols-3 gap-4 mb-10">
                                    {presetCards.filter(p => !searchQuery || p.label.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                        <button key={p.key} onClick={() => applyPreset(p.key, p.w, p.h)}
                                            className="group p-5 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-900/20">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl mb-3`}>{p.icon}</div>
                                            <div className="font-semibold">{p.label}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{p.sub}</div>
                                        </button>
                                    ))}
                                </div>

                                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Quick Templates</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {dashTemplates.filter(t => !searchQuery || t.label.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                                        <button key={t.key} onClick={() => { setCurrentView('editor'); }}
                                            className="group h-36 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden relative transition-all hover:scale-[1.02]">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${t.thumb} opacity-70`} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl mb-2">{t.icon}</span>
                                                <span className="font-semibold text-white text-sm">{t.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={setAuthUser} />
            </div>
        );
    }

    // =========================================================================
    // VIEW 2: DEDICATED PASSPORT PHOTO STUDIO
    // =========================================================================
    if (currentView === 'passport-studio') {
        const config = passportDimensions[passportPaperSize];
        return (
            <div className="flex flex-col h-screen w-screen bg-[#0c0c0e] text-white overflow-hidden font-sans">
                <header className="h-14 bg-[#121217] border-b border-[#1e1e24] flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setCurrentView('dashboard'); handleClearPassportPhoto(); }} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold bg-[#1a1a22] hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-[#262633] transition">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                        <div className="h-4 w-px bg-zinc-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Passport Studio Pro</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                {passportStudioMode === 'edit' ? '1. Staging & Cropping' : '2. Ready Print Sheet'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {passportStudioMode === 'sheet' && (
                            <>
                                <button onClick={() => { setPassportStudioMode('edit'); setIsCroppingPassport(false); }} className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
                                    <RefreshCw size={13} /> Re-Edit Photo
                                </button>
                                <button onClick={exportPassportPNG} className="px-4 py-2 bg-[#1a1a22] hover:bg-zinc-800 border border-[#262633] text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
                                    <ImageIcon size={14} /> Download Image
                                </button>
                                <button onClick={exportPassportPDF} className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition hover:scale-105">
                                    <Printer size={14} /> Export Print PDF
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-80 bg-[#121216] border-r border-[#1e1e24] p-5 flex flex-col gap-5 overflow-y-auto shrink-0 z-10">
                        <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">1. Photo Source</span>
                            <input type="file" ref={passportFileInputRef} accept="image/*" className="hidden" onChange={handlePassportImageUpload} />

                            {passportSourceUrl ? (
                                <div className="p-3 bg-[#17171e] border border-zinc-800 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={passportAdjustedImgData || passportSourceUrl} alt="passport" className="w-12 h-14 object-cover rounded-lg border border-zinc-700" />
                                        <div>
                                            <p className="text-xs font-bold text-zinc-200">Customer Photo</p>
                                            <p className="text-[10px] text-emerald-400">Status: Loaded</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => passportFileInputRef.current?.click()} className="text-[11px] bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg text-zinc-300 font-medium">
                                            Change
                                        </button>
                                        <button onClick={handleClearPassportPhoto} title="Remove / Clear Photo" className="text-[11px] bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 p-1.5 rounded-lg text-red-400">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => passportFileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 bg-zinc-900/40 text-zinc-400 hover:text-emerald-400 transition">
                                    <ImagePlus size={28} />
                                    <span className="text-xs font-semibold">Click to Upload Customer Photo</span>
                                </button>
                            )}
                        </div>

                        {passportStudioMode === 'edit' && passportSourceUrl && (
                            <div className="space-y-4 pt-2 border-t border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">2. Crop & Enhance Tools</span>

                                <div className="space-y-2">
                                    <button onClick={applyAutoPassportCrop} className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                                        <Crop size={14} /> 🎯 Auto 3.5cm x 4.5cm Crop
                                    </button>

                                    {!isCroppingPassport ? (
                                        <button onClick={() => { setIsCroppingPassport(true); startIndependentImageCrop(passportFabricCanvasRef.current); }} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-zinc-300 transition">
                                            <Scissors size={14} /> Manual Interactive Crop
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => cancelIndependentCrop(passportFabricCanvasRef.current, () => setIsCroppingPassport(false))} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                                                <X size={13} /> Cancel
                                            </button>
                                            <button onClick={() => applyIndependentCrop(passportFabricCanvasRef.current, (url) => { setIsCroppingPassport(false); if (url) setPassportAdjustedImgData(url); })} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-lg transition">
                                                <Check size={13} /> Apply Crop
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3.5 bg-[#17171e] border border-zinc-800 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-300">Light Adjustments</span>
                                        <button onClick={() => {
                                            setPassportBrightness(10);
                                            setPassportContrast(16);
                                            setPassportSaturation(12);
                                            applyFilterToCanvasImage(passportFabricCanvasRef.current, 'Brightness', 10);
                                            applyFilterToCanvasImage(passportFabricCanvasRef.current, 'Contrast', 16);
                                            applyFilterToCanvasImage(passportFabricCanvasRef.current, 'Saturation', 12);
                                        }} className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold hover:bg-emerald-500 hover:text-white transition flex items-center gap-1">
                                            <Sparkles size={11} /> Auto Enhance
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                                                <span>Brightness</span>
                                                <span>{passportBrightness}</span>
                                            </div>
                                            <input type="range" min="-100" max="100" value={passportBrightness} onChange={e => { setPassportBrightness(Number(e.target.value)); applyFilterToCanvasImage(passportFabricCanvasRef.current, 'Brightness', Number(e.target.value)); }} className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                                                <span>Contrast</span>
                                                <span>{passportContrast}</span>
                                            </div>
                                            <input type="range" min="-100" max="100" value={passportContrast} onChange={e => { setPassportContrast(Number(e.target.value)); applyFilterToCanvasImage(passportFabricCanvasRef.current, 'Contrast', Number(e.target.value)); }} className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                {/* AI BG Removal & Custom Background Swatches for Photo */}
                                <div className="space-y-2.5">
                                    <button onClick={handlePassportBgRemove} disabled={isRemovingBgPassport} className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition">
                                        {isRemovingBgPassport ? <><Loader2 size={14} className="animate-spin" /> Removing Background...</> : <><Wand2 size={14} /> 1-Click AI BG Remove</>}
                                    </button>

                                    <div className="p-3 bg-[#17171e] border border-zinc-800 rounded-xl space-y-2">
                                        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5"><Palette size={13} /> Color Behind Face</span>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { color: 'transparent', label: 'None' },
                                                { color: '#ffffff', label: 'White' },
                                                { color: '#bae6fd', label: 'Sky' },
                                                { color: '#1e3a8a', label: 'Blue' },
                                                { color: '#e2e8f0', label: 'Gray' },
                                                { color: '#991b1b', label: 'Red' },
                                                { color: '#fef3c7', label: 'Cream' },
                                                { color: '#dcfce7', label: 'Mint' }
                                            ].map(c => (
                                                <button
                                                    key={c.color}
                                                    onClick={() => {
                                                        setPassportBgColor(c.color);
                                                        const activeC = passportFabricCanvasRef.current;
                                                        const activeImg = activeC?.getActiveObject() || activeC?.getObjects().find((o: any) => o.type === 'image' || o.type === 'FabricImage');
                                                        if (activeImg) {
                                                            activeImg.set('backgroundColor', c.color === 'transparent' ? undefined : c.color);
                                                            activeC.renderAll();
                                                        }
                                                    }}
                                                    className={`py-1 text-[9px] font-bold rounded-lg border transition ${passportBgColor === c.color ? 'border-emerald-500 text-emerald-400 bg-emerald-500/20' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-800 space-y-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">3. Generate Print Sheet</span>
                                    <button onClick={() => { setPassportPaperSize('A4'); handleGeneratePassportGrid(42); }} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition hover:scale-[1.02]">
                                        <Grid size={14} /> Generate 42 Photos (A4 Sheet)
                                    </button>
                                    <button onClick={() => { setPassportPaperSize('4x6'); handleGeneratePassportGrid(8); }} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition">
                                        <Grid size={14} /> Generate 8 Photos (4x6 Paper)
                                    </button>
                                </div>
                            </div>
                        )}

                        {passportStudioMode === 'sheet' && (
                            <div className="space-y-5 pt-2 border-t border-zinc-800">
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Paper Sheet Size</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'A4', label: 'A4 Sheet', sub: 'Max 42' },
                                            { id: '4x6', label: '4 × 6 Paper', sub: 'Max 8' },
                                            { id: 'single', label: 'Single', sub: '1 Card' },
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setPassportPaperSize(p.id as any);
                                                    if (p.id === 'A4') setPassportCount(42);
                                                    if (p.id === '4x6') setPassportCount(8);
                                                    if (p.id === 'single') setPassportCount(1);
                                                }}
                                                className={`p-2 rounded-xl border text-left transition ${passportPaperSize === p.id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-[#17171e] border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                            >
                                                <div className="font-bold text-xs">{p.label}</div>
                                                <div className="text-[9px] text-zinc-500 mt-0.5">{p.sub}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {passportPaperSize !== 'single' && (
                                    <div className="p-4 bg-[#17171e] border border-zinc-800 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300">Quantity on Sheet:</span>
                                            <span className="text-xs font-mono font-bold bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-lg">{passportCount} Photos</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPassportCount(Math.max(1, passportCount - 1))} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
                                                <MinusCircle size={14} /> -1 Photo
                                            </button>
                                            <button onClick={() => setPassportCount(Math.min(config.max, passportCount + 1))} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
                                                <PlusCircle size={14} /> +1 Photo
                                            </button>
                                        </div>

                                        <input
                                            type="range"
                                            min="1"
                                            max={config.max}
                                            value={passportCount}
                                            onChange={e => setPassportCount(Number(e.target.value))}
                                            className="w-full accent-emerald-500 cursor-pointer"
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-[#17171e] border border-zinc-800 rounded-xl">
                                        <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><Scissors size={14} /> Cutting Border (Stroke)</span>
                                        <input type="checkbox" checked={borderStroke} onChange={e => setBorderStroke(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                    <main ref={passportWrapperRef} className="flex-1 bg-[#0f0f13] flex items-center justify-center overflow-hidden relative"
                        style={{ backgroundImage: 'radial-gradient(circle, #22222a 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

                        {isCroppingPassport && passportStudioMode === 'edit' && (
                            <div className="absolute top-6 z-30 bg-[#17171e] border border-indigo-500/60 rounded-full px-5 py-2 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
                                <span className="text-xs font-semibold text-indigo-300">Drag/Resize Box to Crop:</span>
                                <button onClick={() => applyIndependentCrop(passportFabricCanvasRef.current, (url) => { setIsCroppingPassport(false); if (url) setPassportAdjustedImgData(url); })} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition">
                                    <Check size={14} /> Apply Crop
                                </button>
                                <button onClick={() => cancelIndependentCrop(passportFabricCanvasRef.current, () => setIsCroppingPassport(false))} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full text-xs font-medium flex items-center gap-1 transition">
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}

                        <div className="bg-white shadow-[0_30px_90px_rgba(0,0,0,0.85)] ring-1 ring-zinc-700 origin-center transition-all"
                            style={{
                                width: passportStudioMode === 'edit' ? 700 : config.width,
                                height: passportStudioMode === 'edit' ? 900 : config.height,
                                transform: `scale(${passportZoomRatio})`
                            }}>
                            <canvas ref={passportCanvasElRef} />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VIEW 3: FULL CANVAS GRAPHIC DESIGN EDITOR
    // =========================================================================
    const sidebarTabs = [
        { id: 'elements', icon: <Square size={18} />, label: 'Elements' },
        { id: 'text', icon: <Type size={18} />, label: 'Text' },
        { id: 'uploads', icon: <ImagePlus size={18} />, label: 'Media' },
        { id: 'background', icon: <Wallpaper size={18} />, label: 'Background' },
        { id: 'templates', icon: <LayoutTemplate size={18} />, label: 'Templates' },
        { id: 'layers', icon: <LayersIcon size={18} />, label: 'Layers' },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0c0c0e] text-white overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-16 bg-[#0c0c0e] border-r border-[#1e1e24] flex flex-col items-center pt-3 pb-4 gap-1 shrink-0">
                    {sidebarTabs.map(t => (
                        <button key={t.id} title={t.label} onClick={() => setActiveTab(t.id)}
                            className={`w-11 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[9px] font-semibold tracking-wide ${activeTab === t.id
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'text-zinc-600 hover:text-zinc-300 hover:bg-[#1a1a22]'
                                }`}>
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <aside className="w-72 bg-[#121216] border-r border-[#1e1e24] flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-3 border-b border-[#1e1e24]">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder={`Search ${sidebarTabs.find(t => t.id === activeTab)?.label ?? ''}…`}
                                className="w-full bg-[#1a1a22] border border-[#262633] rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto space-y-4">
                        {/* ELEMENTS */}
                        {activeTab === 'elements' && (
                            <>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Basic Shapes</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Rectangle', icon: <Square size={28} className="text-white/80" />, action: addRect },
                                        { label: 'Circle', icon: <CircleIcon size={28} className="text-white/80" />, action: addCircle },
                                        { label: 'Triangle', icon: <TriangleIcon size={28} className="text-white/80" />, action: addTriangle },
                                        { label: 'Line', icon: <Minus size={28} className="text-white/80" />, action: addLine },
                                        { label: 'Star', icon: <Star size={28} className="text-white/80" />, action: addStar },
                                        { label: 'Frame', icon: <Frame size={28} className="text-white/80" />, action: addCircle },
                                    ].map(({ label, icon, action }) => (
                                        <button key={label} onClick={action}
                                            className="bg-[#1a1a22] border border-[#262633] hover:border-indigo-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#1e1e2e] group">
                                            <div className="opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
                                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* TEXT */}
                        {activeTab === 'text' && (
                            <div className="space-y-2">
                                <button onClick={addHeading} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl font-bold text-lg text-zinc-100 transition-colors">Add Heading</button>
                                <button onClick={addSubheading} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl font-medium text-sm text-zinc-300 transition-colors">Add Subheading</button>
                                <button onClick={addBodyText} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-400 transition-colors">Add Body Text</button>
                            </div>
                        )}

                        {/* UPLOADS */}
                        {activeTab === 'uploads' && (
                            <div className="space-y-4">
                                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-xl flex flex-col items-center gap-2 text-zinc-400 hover:text-indigo-400 transition-colors bg-zinc-900/50">
                                    <ImagePlus size={22} />
                                    <span className="text-xs font-medium">Upload Image</span>
                                </button>
                                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Stock Photos</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {stockPhotos.map((url, i) => (
                                        <button key={i} onClick={() => addStockPhoto(url)}
                                            className="aspect-video rounded-lg overflow-hidden border border-zinc-700 hover:border-indigo-400 transition-colors">
                                            <img src={url} alt="stock" className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* BACKGROUND TAB */}
                        {activeTab === 'background' && (
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Solid Colors</span>
                                        <span className="text-[9px] text-zinc-500">
                                            {activeObject?.type === 'image' || activeObject?.type === 'FabricImage' ? 'Target: Selected Image' : 'Target: Page Canvas'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {bgColorsList.map((color, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applySmartBackground(color, false)}
                                                style={{ backgroundColor: color }}
                                                className="w-8 h-8 rounded-lg border border-zinc-700 hover:scale-110 hover:border-indigo-400 transition-all shadow-sm"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Studio & Aesthetic Textures</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {bgStockWallpapers.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applySmartBackground(url, true)}
                                                className="aspect-[4/3] rounded-xl overflow-hidden border border-zinc-700 hover:border-indigo-400 hover:scale-[1.03] transition-all relative group"
                                            >
                                                <img src={url} alt="wallpaper" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-[10px] font-bold text-white bg-indigo-600/80 px-2 py-0.5 rounded-full">Apply</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TEMPLATES */}
                        {activeTab === 'templates' && (
                            <div className="space-y-2">
                                {dashTemplates.map(t => (
                                    <button key={t.key} onClick={() => loadTemplate(t.key)}
                                        className={`w-full h-20 rounded-xl bg-gradient-to-br ${t.thumb} flex items-center justify-center space-x-2 border border-white/10 hover:border-indigo-400/50 transition-all hover:scale-[1.01]`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <span className="font-semibold text-white text-sm">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* LAYERS */}
                        {activeTab === 'layers' && (
                            <div className="space-y-1">
                                {layers.length === 0 && <p className="text-xs text-zinc-600 text-center py-6">No objects yet</p>}
                                {layers.map((obj, i) => (
                                    <div key={i}
                                        onClick={() => { const c = fabricCanvasRef.current; if (c) { c.setActiveObject(obj); c.renderAll(); syncState(); } }}
                                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors text-xs ${activeObject === obj ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-zinc-400'}`}>
                                        <span className="truncate">{obj.name || obj.type || 'Layer'}</span>
                                        <div className="flex items-center gap-1 ml-2 shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }} className="p-0.5 hover:text-white">
                                                {obj.visible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); const c = fabricCanvasRef.current; if (c && c.bringObjectForward) { c.bringObjectForward(obj); c.renderAll(); syncState(); } }} className="p-0.5 hover:text-white"><ChevronUp size={11} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); const c = fabricCanvasRef.current; if (c && c.sendObjectBackwards) { c.sendObjectBackwards(obj); c.renderAll(); syncState(); } }} className="p-0.5 hover:text-white"><ChevronDown size={11} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-14 bg-[#111118]/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-5 shrink-0 z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentView('dashboard')}
                                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-medium bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700">
                                <Home size={13} /><span>Home</span>
                            </button>
                            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4 text-zinc-300">
                                <button onClick={undo} title="Undo (Ctrl+Z)" className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30"><Undo2 size={15} /></button>
                                <button onClick={redo} title="Redo (Ctrl+Y)" className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30"><Redo2 size={15} /></button>
                            </div>
                            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                                <span className="text-xs text-zinc-500">Size:</span>
                                <select value={activePreset}
                                    onChange={e => {
                                        const v = e.target.value;
                                        const p = presetCards.find(pc => pc.key === v);
                                        if (p) applyPreset(p.key, p.w, p.h);
                                    }}
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-zinc-300 cursor-pointer">
                                    {presetCards.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {authUser && (
                                <button
                                    onClick={async () => {
                                        if (!fabricCanvasRef.current) return;
                                        setIsSaving(true);
                                        try {
                                            const canvasData = fabricCanvasRef.current.toJSON();
                                            const payload = {
                                                name: `Project ${new Date().toLocaleDateString()}`,
                                                data: canvasData
                                            };
                                            if (currentProjectId) {
                                                await api.put(`/projects/${currentProjectId}`, payload);
                                            } else {
                                                const { data } = await api.post('/projects', payload);
                                                setCurrentProjectId(data.id);
                                            }
                                            setToast({ message: 'Project saved successfully!', type: 'success' });
                                        } catch (e) {
                                            console.error(e);
                                            setToast({ message: 'Failed to save project.', type: 'error' });
                                        }
                                        setIsSaving(false);
                                        setTimeout(() => setToast(null), 3000);
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700"
                                >
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    <span>Save</span>
                                </button>
                            )}

                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-1">
                                <button onClick={() => { fabricCanvasRef.current?.setZoom((fabricCanvasRef.current.getZoom() ?? 1) * 0.85); }} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ZoomOut size={13} /></button>
                                <span className="text-xs font-mono px-2 text-zinc-300">{Math.round((fabricCanvasRef.current?.getZoom() ?? 1) * 100)}%</span>
                                <button onClick={() => { fabricCanvasRef.current?.setZoom((fabricCanvasRef.current.getZoom() ?? 1) * 1.15); }} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ZoomIn size={13} /></button>
                                <button onClick={() => { fabricCanvasRef.current?.setZoom(1); }} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><Maximize size={13} /></button>
                            </div>
                            <div className="relative">
                                <button onClick={() => setExportOpen(v => !v)}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105">
                                    <span>Export</span><Download size={14} />
                                </button>
                                {exportOpen && (
                                    <div className="absolute top-11 right-0 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50">
                                        <button onClick={exportPDF} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-2 text-sm text-indigo-400 font-medium"><FileText size={13} /><span>PDF Document</span></button>
                                        <button onClick={exportPNG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-300"><ImageIcon size={13} className="text-blue-400" /><span>PNG Image</span></button>
                                        <button onClick={exportSVG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-300"><FileImage size={13} className="text-pink-400" /><span>SVG Vector</span></button>
                                        <button onClick={exportJSON} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-300"><FileJson size={13} className="text-emerald-400" /><span>JSON State</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <main ref={wrapperRef} className="flex-1 bg-[#121216] flex items-center justify-center overflow-hidden relative"
                        style={{ backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

                        {isCroppingEditor && (
                            <div className="absolute top-6 z-30 bg-[#17171e] border border-indigo-500/60 rounded-full px-5 py-2 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
                                <span className="text-xs font-semibold text-indigo-300">Drag/Resize Box to Crop:</span>
                                <button onClick={() => applyIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition">
                                    <Check size={14} /> Apply Crop
                                </button>
                                <button onClick={() => cancelIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full text-xs font-medium flex items-center gap-1 transition">
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}

                        <div className="bg-white rounded-sm shadow-[0_25px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 origin-center transition-all"
                            style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoomRatio})` }}>
                            {Object.values(activeCursors).map((c: any) => (
                                <div key={c.socketId} className="absolute z-[99]" style={{ left: c.cursor.x * zoomRatio, top: c.cursor.y * zoomRatio, transition: 'all 0.1s ease-out', pointerEvents: 'none' }}>
                                    <MousePointer2 fill="#ec4899" color="#ec4899" size={16} className="-rotate-12 drop-shadow-md" />
                                    <div className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg translate-x-3 translate-y-1">{c.user?.name || 'Guest'}</div>
                                </div>
                            ))}
                            <canvas ref={canvasElRef} />
                        </div>
                    </main>
                </div>

                <aside className="w-72 bg-[#111118] border-l border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
                    <div className="px-4 py-3.5 border-b border-zinc-800">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Properties</span>
                    </div>

                    {!activeObject ? (
                        <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">Select an element</div>
                    ) : (
                        <div className="p-4 space-y-6 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={copy} className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"><Copy size={12} />Copy</button>
                                <button onClick={() => { copy(); paste(); }} className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"><Copy size={12} />Duplicate</button>
                                <button onClick={deleteSelected} className="col-span-2 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-900/40 rounded-lg text-red-400 flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"><Trash2 size={12} />Delete</button>
                            </div>

                            {(activeObject.type === 'image' || activeObject.type === 'FabricImage') && (
                                <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Image Tools</p>
                                        <button onClick={() => {
                                            setEditorBrightness(10);
                                            setEditorContrast(15);
                                            setEditorSaturation(12);
                                            applyFilterToCanvasImage(fabricCanvasRef.current, 'Brightness', 10);
                                            applyFilterToCanvasImage(fabricCanvasRef.current, 'Contrast', 15);
                                            applyFilterToCanvasImage(fabricCanvasRef.current, 'Saturation', 12);
                                        }} className="text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition">
                                            <Sparkles size={11} /> Auto Enhance
                                        </button>
                                    </div>

                                    {!isCroppingEditor ? (
                                        <button onClick={() => { setIsCroppingEditor(true); startIndependentImageCrop(fabricCanvasRef.current); }} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 text-indigo-400 transition">
                                            <Crop size={14} /> Crop Image
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => cancelIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                                                <X size={13} /> Cancel
                                            </button>
                                            <button onClick={() => applyIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md transition">
                                                <Check size={13} /> Apply
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                                <span>Brightness</span>
                                                <span>{editorBrightness}</span>
                                            </div>
                                            <input type="range" min="-100" max="100" value={editorBrightness} onChange={e => { setEditorBrightness(Number(e.target.value)); applyFilterToCanvasImage(fabricCanvasRef.current, 'Brightness', Number(e.target.value)); }} className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                                <span>Contrast</span>
                                                <span>{editorContrast}</span>
                                            </div>
                                            <input type="range" min="-100" max="100" value={editorContrast} onChange={e => { setEditorContrast(Number(e.target.value)); applyFilterToCanvasImage(fabricCanvasRef.current, 'Contrast', Number(e.target.value)); }} className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>

                                    <button onClick={handleRemoveBackgroundEditor} disabled={isRemovingBgEditor} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 text-white shadow-md transition-all">
                                        {isRemovingBgEditor ? <><Loader2 size={14} className="animate-spin" /> Removing Background...</> : <><Wand2 size={14} /> Remove Background (AI)</>}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Align</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[['left', <AlignLeft size={14} />], ['center-h', <AlignCenter size={14} />], ['right', <AlignRight size={14} />], ['top', <ArrowUpToLine size={14} />], ['center-v', <Minus size={14} />], ['bottom', <ArrowDownToLine size={14} />]].map(([d, icon]) => (
                                        <button key={d as string} onClick={() => alignObj(d as string)} className="py-2 flex justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">{icon}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Opacity</p>
                                    <span className="text-xs font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{Math.round(getProp('opacity', 1) * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={getProp('opacity', 1)} onChange={e => setProp('opacity', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                            </div>

                            {activeObject.type !== 'i-text' && activeObject.type !== 'image' && activeObject.type !== 'FabricImage' && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fill Color</p>
                                    <input type="color" value={typeof getProp('fill', '#6366f1') === 'string' ? getProp('fill', '#6366f1') : '#6366f1'} onChange={e => setProp('fill', e.target.value)} className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-zinc-700" />
                                </div>
                            )}

                            {activeObject.type === 'i-text' && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Typography</p>
                                    <input type="color" value={typeof getProp('fill', '#000000') === 'string' ? getProp('fill', '#000000') : '#000000'} onChange={e => setProp('fill', e.target.value)} className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-zinc-700" />
                                    <div className="flex gap-2">
                                        <button onClick={() => setProp('fontWeight', getProp('fontWeight', 'normal') === 'bold' ? 'normal' : 'bold')}
                                            className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center transition-colors ${getProp('fontWeight') === 'bold' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Bold size={13} /></button>
                                        <button onClick={() => setProp('fontStyle', getProp('fontStyle', 'normal') === 'italic' ? 'normal' : 'italic')}
                                            className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center transition-colors ${getProp('fontStyle') === 'italic' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Italic size={13} /></button>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-400"><span>Font Size</span><span>{getProp('fontSize', 24)}px</span></div>
                                        <input type="range" min="8" max="200" value={getProp('fontSize', 24)} onChange={e => setProp('fontSize', parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                    </div>
                                </div>
                            )}

                            {['rect', 'circle', 'triangle'].includes(activeObject.type ?? '') && (
                                <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gradient Fill</p>
                                        <span className="text-[9px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-bold border border-pink-500/30">PRO</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[9px] text-zinc-500 uppercase block mb-1">Stop 1</label><input type="color" value={gradColor1} onChange={e => setGradColor1(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" /></div>
                                        <div className="flex-1"><label className="text-[9px] text-zinc-500 uppercase block mb-1">Stop 2</label><input type="color" value={gradColor2} onChange={e => setGradColor2(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" /></div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-400"><span>Angle</span><span>{gradAngle}°</span></div>
                                        <input type="range" min="0" max="360" value={gradAngle} onChange={e => setGradAngle(parseInt(e.target.value))} className="w-full accent-pink-500" />
                                    </div>
                                    <button onClick={applyGradient} className="w-full py-2 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg transition-all">Apply Gradient</button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </div>

            {/* Bottom Page Bar */}
            <div className="h-[72px] bg-[#0d0d10] border-t border-zinc-800/80 flex items-center px-5 gap-3 overflow-x-auto shrink-0 z-20">
                {pages.map((p, i) => (
                    <div
                        key={p.id}
                        onClick={() => switchPage(i)}
                        className={`relative w-24 h-12 rounded-lg border-2 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all cursor-pointer ${activePageIndex === i
                            ? 'border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                            : 'border-zinc-700 hover:border-zinc-500'
                            }`}
                        style={{ backgroundColor: p.backgroundColor }}
                    >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded z-10 ${activePageIndex === i ? 'bg-indigo-600 text-white' : 'bg-black/70 text-zinc-300'}`}>
                            {p.name}
                        </span>
                        {pages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); deletePage(i); }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] rounded-full items-center justify-center font-bold opacity-0 hover:opacity-100 transition-opacity flex"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={addPage}
                    className="w-12 h-12 flex-shrink-0 rounded-lg border-2 border-dashed border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center text-zinc-500 transition-all bg-zinc-900/50"
                >
                    <Plus size={18} />
                </button>
            </div>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={setAuthUser} />
            {toast && (
                <div className={`fixed bottom-24 right-5 z-[999] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-[#1a1a22] border-emerald-500/50 text-emerald-400' : 'bg-[#1a1a22] border-red-500/50 text-red-400'} border`}>
                    <span className="text-sm font-semibold">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>
            )}
        </div>
    );
}