'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import { removeBackground } from '@imgly/background-removal';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus, Star,
    Type, ImagePlus, LayoutTemplate, Layers as LayersIcon, AlignLeft, AlignCenter,
    AlignRight, ArrowUpToLine, ArrowDownToLine, Bold, Italic, Undo2, Redo2,
    Download, ZoomIn, ZoomOut, Maximize, Home, Plus, Search, Copy, Trash2,
    Eye, EyeOff, Sparkles, FileImage, FileJson, Image as ImageIcon, Wand2,
    Frame, PanelTop, Grid, Scissors, FileText, Loader2, PlusCircle, MinusCircle,
    ChevronUp, ChevronDown, ArrowLeft, Printer, Palette, Crop, Check, RefreshCw, X,
    Wallpaper, User, Save, Cloud, MousePointer2, Monitor, Info, Lock, Unlock,
    CopyPlus, MoreHorizontal, Clock, Link as LinkIcon, BarChart, LayoutGrid, CheckSquare, Grid3X3, Film, Music, BoxSelect
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

export const dashTemplates = [
    { key: 't-fashion-1', label: 'Fashion Poster', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
    { key: 't-magazine-1', label: 'Creative Magazine', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400' },
    { key: 't-typography-1', label: 'Typography Box', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400' },
    { key: 't-minimal-1', label: 'Minimal Studio', url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400' }
];

export const brandCategories = [
    { id: 'all', label: 'All assets' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'templates', label: 'Brand Templates' },
    { id: 'logos', label: 'Logos' },
    { id: 'colours', label: 'Colours' },
    { id: 'fonts', label: 'Fonts' },
    { id: 'voice', label: 'Brand voice' },
    { id: 'photos', label: 'Photos' },
    { id: 'components', label: 'Components' },
    { id: 'graphics', label: 'Graphics' },
    { id: 'icons', label: 'Icons' },
    { id: 'charts', label: 'Charts' }
];

export const brandMockData = {
    templates: Array.from({ length: 16 }).map((_, i) => `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400&q=80`), // Placeholder template URLs
    logos: Array.from({ length: 16 }).map((_, i) => `https://api.dicebear.com/9.x/initials/svg?seed=Brand${i}&backgroundColor=${['000000', 'ffffff', '6366f1', 'ec4899', 'f59e0b'][i % 5]}`),
    colours: [
        '#000000', '#ffffff', '#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1',
        '#0f172a', '#334155', '#cbd5e1', '#f8fafc', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2'
    ],
    fonts: [
        { label: 'Primary Header', family: 'Inter', weight: 'bold' },
        { label: 'Secondary Header', family: 'Inter', weight: '600' },
        { label: 'Body Text', family: 'Inter', weight: 'normal' },
        { label: 'Caption', family: 'Inter', weight: '300' },
        { label: 'Serif Accent', family: 'Georgia', weight: 'italic' },
        { label: 'Mono Code', family: 'Courier New', weight: 'normal' },
        // Filler to 15
        ...Array.from({ length: 10 }).map((_, i) => ({ label: `Brand Text ${i + 1}`, family: 'Inter', weight: 'normal' }))
    ],
    photos: [
        'https://images.unsplash.com/photo-1542314831-c5a4d407e997?w=400',
        'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400',
        'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400',
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
        'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
        'https://images.unsplash.com/photo-1526045612212-70caf35c1ecb?w=400',
        'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400'
    ],
    icons: Array.from({ length: 16 }).map((_, i) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="${6 + (i % 5)}"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line></svg>`),
    graphics: Array.from({ length: 16 }).map((_, i) => `<svg viewBox="-10 -10 120 120" fill="#6366f1" stroke="none"><path d="M50 0 L100 50 L50 100 L0 50 Z" opacity="${0.5 + (0.03 * i)}" transform="rotate(${i * 15}, 50, 50)"/></svg>`),
    components: Array.from({ length: 16 }).map((_, i) => ({ label: `Button ${i + 1}`, color: ['#6366f1', '#ec4899', '#10b981'][i % 3] })),
    charts: Array.from({ length: 15 }).map((_, i) => `<svg viewBox="0 0 100 100" fill="none" stroke="#f59e0b" stroke-width="3"><polyline points="0,${100 - i * 5} 33,${20 + i * 4} 66,${80 - i * 3} 100,${10 + i * 2}"/><polyline points="0,${60 + i * 2} 33,${90 - i} 66,${30 + i * 2} 100,${50 - i}" stroke="#3b82f6"/></svg>`)
};

// ==========================================
// Fabric.js Global Settings Overhaul
// ==========================================
if (typeof window !== 'undefined') {
    Object.assign((fabric as any).Object.prototype, {
        transparentCorners: false,
        borderColor: '#3b82f6',
        cornerColor: '#3b82f6',
        cornerStrokeColor: '#3b82f6',
        cornerStyle: 'rect',
        cornerSize: 14,
        padding: 5,
        borderScaleFactor: 2.5,
        borderOpacityWhenMoving: 0.8
    });
}

export default function CanvasEditor({ initialView = 'editor' }: { initialView?: 'editor' | 'passport-studio' }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // ── Navigation State ─────────────────────────────────────────────────────
    const [currentView, setCurrentView] = useState<'editor' | 'passport-studio'>(initialView);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Auth & Persistence State ─────────────────────────────────────────────
    const [authUser, setAuthUser] = useState<any>(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // ── Collaboration State ──────────────────────────────────────────────────
    const socketRef = useRef<Socket | null>(null);
    const [activeCursors, setActiveCursors] = useState<{ [id: string]: any }>({});
    const isSocketUpdate = useRef(false);

    useEffect(() => {
        const saved = localStorage.getItem('designit_user');
        if (saved) setAuthUser(JSON.parse(saved));

        // socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

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
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const isInHistory = useRef(false);
    const clipboard = useRef<any>(null);

    const [canvasWidth, setCanvasWidth] = useState(1080);
    const [canvasHeight, setCanvasHeight] = useState(1080);
    const [zoomRatio, setZoomRatio] = useState(0.5);

    useEffect(() => {
        const sizeParam = searchParams.get('size');
        if (sizeParam === 'A4') { setCanvasWidth(794); setCanvasHeight(1123); setActivePreset('A4 Document'); }
        else if (sizeParam === 'A3') { setCanvasWidth(1123); setCanvasHeight(1587); setActivePreset('A3 Document'); }
        else if (sizeParam === 'A2') { setCanvasWidth(1587); setCanvasHeight(2245); setActivePreset('A2 Document'); }
        else if (sizeParam === 'IG') { setCanvasWidth(1080); setCanvasHeight(1080); setActivePreset('Instagram Post'); }
    }, [searchParams]);

    const [activePreset, setActivePreset] = useState('Instagram Post');
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(''); // Start closed, user opens what they want
    const [activeElementsCategory, setActiveElementsCategory] = useState<string | null>(null);
    const [activeBrandCategory, setActiveBrandCategory] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [activeToolFlyout, setActiveToolFlyout] = useState<string | null>(null);
    const [signatureTab, setSignatureTab] = useState<'text' | 'draw' | 'upload'>('text');
    const [signatureText, setSignatureText] = useState('John Doe');
    const [signatureFont, setSignatureFont] = useState('Caveat');
    const [signatureColor, setSignatureColor] = useState('#000000');

    // -- Projects & Auto-Save State --
    const [activeProjectsFilter, setActiveProjectsFilter] = useState<'all' | 'designs' | 'folders'>('all');
    const [activeFolder, setActiveFolder] = useState<string | null>(null);
    const [savedProjects, setSavedProjects] = useState<any[]>([]);
    const [savedFolders, setSavedFolders] = useState<any[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [createFolderName, setCreateFolderName] = useState('Untitled folder');
    const folderUploadInputRef = useRef<HTMLInputElement>(null);

    const [exportOpen, setExportOpen] = useState(false);
    const [activeObject, setActiveObject] = useState<any>(null);
    const [layers, setLayers] = useState<any[]>([]);
    const [isRemovingBgEditor, setIsRemovingBgEditor] = useState(false);

    // Magic Write
    const [isMagicWriteOpen, setIsMagicWriteOpen] = useState(false);
    const [magicWriteText, setMagicWriteText] = useState('');

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
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number } | null>(null);
    const [inlineMenuPos, setInlineMenuPos] = useState<{ x: number, y: number } | null>(null);

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

        setCanUndo(historyIndex.current > 0);
        setCanRedo(false);

        if (socketRef.current && currentProjectId && !isSocketUpdate.current) {
            socketRef.current.emit('object-modified', { projectId: currentProjectId, state: c.toJSON() });
        }
    }, [currentProjectId]);

    const addObj = useCallback((obj: any) => {
        const c = fabricCanvasRef.current;
        if (!c) return;

        // Enforce large, prominent control handles directly onto the object instance
        obj.set({
            cornerSize: 14,
            transparentCorners: false,
            borderScaleFactor: 2.5,
            borderColor: '#3b82f6',
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#3b82f6',
            padding: 5
        });

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

        setCanUndo(historyIndex.current > 0);
        setCanRedo(historyIndex.current < historyList.current.length - 1);

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

        setCanUndo(historyIndex.current > 0);
        setCanRedo(historyIndex.current < historyList.current.length - 1);

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
        if (currentView === 'editor') {
            const handleMouseWheel = (opt: any) => {
                const evt = opt.e;
                if (!evt.ctrlKey) return;
                const c = fabricCanvasRef.current;
                if (!c) return;
                let zoom = c.getZoom();
                zoom *= 0.999 ** evt.deltaY;
                if (zoom > 20) zoom = 20;
                if (zoom < 0.01) zoom = 0.01;
                c.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
                evt.preventDefault();
                evt.stopPropagation();
            };

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

            const updateInlineMenu = () => {
                const active = canvas.getActiveObject();
                if (active) {
                    const br = active.getBoundingRect();
                    setInlineMenuPos({ x: br.left + (br.width / 2), y: Math.max(10, br.top - 45) });
                } else {
                    setInlineMenuPos(null);
                }
            };

            canvas.on('object:modified', onModified);
            canvas.on('object:added', syncState);
            canvas.on('object:removed', syncState);
            canvas.on('selection:created', () => { syncState(); updateInlineMenu(); });
            canvas.on('selection:updated', () => { syncState(); updateInlineMenu(); });
            canvas.on('selection:cleared', () => { syncState(); updateInlineMenu(); });
            canvas.on('object:moving', updateInlineMenu);
            canvas.on('object:scaling', updateInlineMenu);
            canvas.on('object:rotating', updateInlineMenu);

            canvas.on('mouse:move', handleCanvasMouseMove);
            canvas.on('mouse:wheel', handleMouseWheel);

            // Hydrate canvas with selected template if present in URL
            const templateImgUrl = searchParams.get('templateImg');
            if (templateImgUrl) {
                const ImageClass = (fabric as any).FabricImage || (fabric as any).Image;

                // 1. Background Fill Layer (Editable)
                const bgRect = new (fabric as any).Rect({
                    left: 0, top: 0,
                    width: canvasWidth || 1080,
                    height: canvasHeight || 1080,
                    fill: '#1a1a24',
                    selectable: true,
                    name: 'Background'
                });
                canvas.add(bgRect);

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = templateImgUrl;
                img.onload = () => {
                    // 2. Load the main preview graphic as a central object
                    const fabricImg = new ImageClass(img);
                    const scale = Math.min((canvasWidth || 1080) / fabricImg.width, (canvasHeight || 1080) / fabricImg.height) * 0.7;
                    fabricImg.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: (canvasWidth || 1080) / 2,
                        top: (canvasHeight || 1080) / 2 + 60,
                        originX: 'center',
                        originY: 'center',
                        name: 'Hero Image'
                    });
                    canvas.add(fabricImg);

                    // 3. Add High Fidelity Editable Headline Text
                    const headline = new (fabric as any).IText("Premium Design Template", {
                        left: (canvasWidth || 1080) / 2,
                        top: 200,
                        fontFamily: 'Inter',
                        fontSize: 64,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        originX: 'center',
                        textAlign: 'center',
                        name: 'Headline'
                    });
                    canvas.add(headline);

                    // 4. Add Subheading typography block
                    const subheading = new (fabric as any).IText("Double click to edit this typography block. Drag to reposition.", {
                        left: (canvasWidth || 1080) / 2,
                        top: 300,
                        fontFamily: 'Inter',
                        fontSize: 28,
                        fill: '#a1a1aa',
                        originX: 'center',
                        textAlign: 'center',
                        name: 'Subtitle'
                    });
                    canvas.add(subheading);

                    // 5. Add a decorative accent block
                    const accent = new (fabric as any).Rect({
                        left: (canvasWidth || 1080) / 2,
                        top: 140,
                        width: 120,
                        height: 6,
                        fill: '#8b5cf6',
                        originX: 'center',
                        rx: 3, ry: 3,
                        name: 'Accent Bar'
                    });
                    canvas.add(accent);

                    canvas.renderAll();
                    setTimeout(() => pushHistory(), 100);
                };
            } else {
                canvas.renderAll();
                setTimeout(() => pushHistory(), 100);
            }
        }

        return () => {
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

    // ── Template Engine (JSON Hydration) ─────────────────────────────────────
    const loadTemplate = async (templateId: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        c.clear();
        c.backgroundColor = '#18181b';

        try {
            // Real Multi-Layer Template Datasets (JSON Hydration Engine)
            const templateDatasets: Record<string, any[]> = {
                't-fashion-1': [
                    { type: 'image', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080', props: { left: canvasWidth / 2, top: canvasHeight / 2, originX: 'center', originY: 'center', name: 'Background Image' }, scaleTo: 'height' },
                    { type: 'rect', props: { left: 0, top: 0, width: canvasWidth, height: canvasHeight, fill: 'rgba(0, 0, 0, 0.4)', name: 'Overlay', selectable: false } },
                    { type: 'text', text: 'FASHION', props: { left: canvasWidth / 2, top: 300, fontFamily: 'Inter', fontSize: 140, fontWeight: 900, fontStyle: 'italic', fill: '#ffffff', originX: 'center', textAlign: 'center', name: 'Main Title', charSpacing: 200 } },
                    { type: 'text', text: 'NEW COLLECTION 2026', props: { left: canvasWidth / 2, top: 480, fontFamily: 'Inter', fontSize: 32, fontWeight: 'bold', fill: '#facc15', originX: 'center', name: 'Subtitle', charSpacing: 100 } },
                    { type: 'rect', props: { left: (canvasWidth / 2) - 130, top: 600, width: 260, height: 70, fill: '#ffffff', name: 'Button BG', rx: 8, ry: 8 } },
                    { type: 'text', text: 'SHOP NOW', props: { left: canvasWidth / 2, top: 635, originX: 'center', originY: 'center', fontSize: 24, fill: '#000000', fontWeight: 900, name: 'Button Text' } }
                ],
                't-magazine-1': [
                    { type: 'rect', props: { left: 0, top: 0, width: canvasWidth, height: canvasHeight, fill: '#fdfbf7', selectable: false, name: 'Background Paper' } },
                    { type: 'rect', props: { left: 40, top: 40, width: canvasWidth - 80, height: canvasHeight - 80, fill: 'transparent', stroke: '#1e1e1e', strokeWidth: 4, name: 'Frame', selectable: false } },
                    { type: 'image', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1080', props: { left: canvasWidth / 2, top: canvasHeight / 2 + 50, originX: 'center', originY: 'center', name: 'Editorial Photo' }, scaleTo: 'width', offsetScale: 160 },
                    { type: 'text', text: 'C R E A T I V E', props: { left: canvasWidth / 2, top: 120, fontFamily: 'Inter', fontSize: 72, fontWeight: 800, fill: '#1e1e1e', originX: 'center', name: 'Masthead' } },
                    { type: 'text', text: 'ISSUE NO. 42 / SPRING 26', props: { left: canvasWidth / 2, top: 220, fontFamily: 'Inter', fontSize: 18, fill: '#52525b', originX: 'center', fontWeight: 'bold', name: 'Volume Info' } }
                ],
                't-typography-1': [
                    { type: 'rect', props: { left: 0, top: 0, width: canvasWidth, height: canvasHeight, fill: '#18181b', selectable: false, name: 'Background' } },
                    { type: 'rect', props: { left: 150, top: 300, width: 400, height: 400, fill: '#fbbf24', opacity: 0.1, name: 'Accent Square' } },
                    { type: 'text', text: 'MODERN', props: { left: 100, top: 250, fontFamily: 'Inter', fontSize: 150, fontWeight: 900, fill: '#ffffff', name: 'Bold Text 1' } },
                    { type: 'text', text: 'TYPO.', props: { left: 100, top: 400, fontFamily: 'Inter', fontSize: 150, fontWeight: 900, fill: '#fbbf24', name: 'Bold Text 2' } },
                    { type: 'text', text: "Explore the boundaries of geometric aesthetics\nand bold lettering in visual design.", props: { left: 110, top: 600, fontFamily: 'Inter', fontSize: 32, fill: '#a1a1aa', lineHeight: 1.4, name: 'Description' } }
                ],
                't-minimal-1': [
                    { type: 'rect', props: { left: 0, top: 0, width: canvasWidth, height: canvasHeight, fill: '#ffffff', selectable: false, name: 'Background' } },
                    { type: 'rect', props: { left: 120, top: 120, width: 5, height: 200, fill: '#000000', name: 'Vertical Line' } },
                    { type: 'text', text: "MINIMAL\nSTUDIO", props: { left: 160, top: 150, fontFamily: 'Inter', fontSize: 80, fontWeight: 400, fill: '#000000', lineHeight: 1.1, name: 'Main Title' } },
                    { type: 'text', text: "LESS IS ABSOLUTELY MORE", props: { left: 160, top: 380, fontFamily: 'Inter', fontSize: 18, fontWeight: 'bold', fill: '#71717a', name: 'Subheading' } },
                    { type: 'circle', props: { left: canvasWidth / 2, top: canvasHeight - 300, radius: 100, fill: 'transparent', stroke: '#e4e4e7', strokeWidth: 2, name: 'Outline Circle' } }
                ]
            };

            const layers = templateDatasets[templateId] || [
                { type: 'rect', props: { left: 0, top: 0, width: canvasWidth, height: canvasHeight, fill: '#6366f1', selectable: false, name: 'Fill Background' } },
                { type: 'text', text: `Premium Template\n${templateId}`, props: { left: canvasWidth / 2, top: canvasHeight / 2, fontFamily: 'Inter', fontSize: 60, fontWeight: 800, fill: '#ffffff', originX: 'center', originY: 'center', textAlign: 'center', name: 'Title' } }
            ];

            // Hydrate layer-by-layer parsing our datasets
            for (const layer of layers) {
                if (layer.type === 'image') {
                    const img = await new Promise<any>((resolve, reject) => {
                        (fabric as any).Image.fromURL(layer.url, (i: any) => {
                            if (i) resolve(i);
                            else reject();
                        }, { crossOrigin: 'anonymous' });
                    });
                    img.set(layer.props);
                    if (layer.scaleTo === 'height') img.scaleToHeight(canvasHeight);
                    if (layer.scaleTo === 'width') img.scaleToWidth(canvasWidth - (layer.offsetScale || 0));
                    c.add(img);
                } else if (layer.type === 'rect') {
                    c.add(new (fabric as any).Rect(layer.props));
                } else if (layer.type === 'circle') {
                    c.add(new (fabric as any).Circle(layer.props));
                } else if (layer.type === 'text') {
                    c.add(new (fabric as any).IText(layer.text, layer.props));
                }
            }

            c.renderAll();
            syncState();
            setTimeout(() => pushHistory(), 100);
        } catch (e) {
            console.error('Failed to load template', e);
        }
    };

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

    const duplicatePage = () => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        const updated = [...pages];
        updated[activePageIndex] = { ...updated[activePageIndex], json: c.toJSON(), backgroundColor: (c.backgroundColor as string) || '#ffffff' };
        const dupPage: PageData = { id: `page-${Date.now()}`, name: `Copy of ${updated[activePageIndex].name}`, json: updated[activePageIndex].json, backgroundColor: updated[activePageIndex].backgroundColor };
        setPages([...updated, dupPage]);
        setActivePageIndex(updated.length);
        // Context is already holding the current JSON, so it implicitly renders duplicate on screen.
        syncState();
    };

    const deletePage = (i: number) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, idx) => idx !== i);
        setPages(newPages);
        if (i === activePageIndex) switchPage(Math.max(0, i - 1));
    };

    const addRect = () => addObj(new (fabric as any).Rect({ left: canvasWidth / 2 - 150, top: canvasHeight / 2 - 150, width: 300, height: 300, fill: '#6366f1', rx: 12 }));
    const addCircle = () => addObj(new (fabric as any).Circle({ left: canvasWidth / 2 - 150, top: canvasHeight / 2 - 150, radius: 150, fill: '#ec4899' }));
    const addTriangle = () => addObj(new (fabric as any).Triangle({ left: canvasWidth / 2 - 150, top: canvasHeight / 2 - 150, width: 300, height: 300, fill: '#10b981' }));
    const addLine = () => addObj(new (fabric as any).Line([canvasWidth / 2 - 200, canvasHeight / 2, canvasWidth / 2 + 200, canvasHeight / 2], { stroke: '#f59e0b', strokeWidth: 10 }));
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

    const addHeading = () => addObj(new (fabric as any).IText('Heading Text', { left: canvasWidth / 2 - 200, top: canvasHeight / 2 - 50, fontSize: 84, fontFamily: 'Inter', fill: '#0f172a', fontWeight: 'bold' }));
    const addSubheading = () => addObj(new (fabric as any).IText('Subheading', { left: canvasWidth / 2 - 150, top: canvasHeight / 2 - 25, fontSize: 48, fontFamily: 'Inter', fill: '#334155', fontWeight: 'bold' }));
    const addBodyText = () => addObj(new (fabric as any).IText('Body text here...', { left: canvasWidth / 2 - 100, top: canvasHeight / 2 - 15, fontSize: 28, fontFamily: 'Inter', fill: '#64748b' }));

    const addFontPreset = (presetKey: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        let objects: any[] = [];
        const cx = (canvasWidth || 1080) / 2;
        const cy = (canvasHeight || 1080) / 2;

        switch (presetKey) {
            case 'happy_bday':
                objects = [
                    new (fabric as any).IText('Happy', { left: cx, top: cy - 40, fontFamily: 'Georgia', fontSize: 90, fontStyle: 'italic', fill: '#ec4899', originX: 'center', originY: 'center', name: 'Happy' }),
                    new (fabric as any).IText('BIRTHDAY', { left: cx, top: cy + 40, fontFamily: 'Inter', fontSize: 60, fontWeight: 900, fill: '#ffffff', originX: 'center', originY: 'center', letterSpacing: 10, name: 'Bday' })
                ];
                break;
            case 'golden_hour':
                objects = [
                    new (fabric as any).IText('GOLDEN', { left: cx, top: cy - 35, fontFamily: 'Inter', fontSize: 80, fontWeight: 900, fill: '#f59e0b', shadow: new (fabric as any).Shadow({ color: 'rgba(245, 158, 11, 0.4)', blur: 15 }), originX: 'center', originY: 'center', name: 'Golden' }),
                    new (fabric as any).IText('HOUR', { left: cx, top: cy + 35, fontFamily: 'Inter', fontSize: 80, fontWeight: 900, fill: '#fcd34d', shadow: new (fabric as any).Shadow({ color: 'rgba(252, 211, 77, 0.4)', blur: 15 }), originX: 'center', originY: 'center', name: 'Hour' })
                ];
                break;
            case 'glow':
                objects = [
                    new (fabric as any).IText('GLOW', { left: cx, top: cy, fontFamily: 'Inter', fontSize: 130, fontWeight: 900, fill: '#ffffff', shadow: new (fabric as any).Shadow({ color: '#ec4899', blur: 30, offsetX: 0, offsetY: 0 }), originX: 'center', originY: 'center', name: 'Glow' })
                ];
                break;
            case 'level_up':
                objects = [
                    new (fabric as any).IText('LEVEL', { left: cx - 25, top: cy - 45, fontFamily: 'Courier New', fontSize: 90, fontWeight: 'bold', fill: '#ef4444', originX: 'center', originY: 'center', shadow: new (fabric as any).Shadow({ color: '#000000', blur: 0, offsetX: 5, offsetY: 5 }) }),
                    new (fabric as any).IText('UP', { left: cx + 25, top: cy + 30, fontFamily: 'Courier New', fontSize: 90, fontWeight: 'bold', fill: '#3b82f6', originX: 'center', originY: 'center', shadow: new (fabric as any).Shadow({ color: '#000000', blur: 0, offsetX: 5, offsetY: 5 }) })
                ];
                break;
            case 'sweet':
                objects = [
                    new (fabric as any).IText('Sweet', { left: cx, top: cy - 30, fontFamily: 'Georgia', fontSize: 110, fontStyle: 'italic', fill: '#f472b6', originX: 'center', originY: 'center', shadow: new (fabric as any).Shadow({ color: 'rgba(244, 114, 182, 0.4)', blur: 20 }) }),
                    new (fabric as any).IText('TREATS', { left: cx, top: cy + 45, fontFamily: 'Inter', fontSize: 24, fontWeight: 'bold', fill: '#ffffff', charSpacing: 300, originX: 'center', originY: 'center' })
                ];
                break;
            case 'wild_sale':
                objects = [
                    new (fabric as any).IText('WILD', { left: cx, top: cy - 50, fontFamily: 'Inter', fontSize: 110, fontWeight: 900, fill: '#eab308', stroke: '#000000', strokeWidth: 4, originX: 'center', originY: 'center' }),
                    new (fabric as any).IText('SALE', { left: cx, top: cy + 50, fontFamily: 'Inter', fontSize: 110, fontWeight: 900, fill: '#ef4444', stroke: '#000000', strokeWidth: 4, originX: 'center', originY: 'center' })
                ];
                break;
            case 'spring_collection':
                objects = [
                    new (fabric as any).IText('SPRING', { left: cx, top: cy - 30, fontFamily: 'Arial', fontSize: 36, fontWeight: 'normal', fill: '#a7f3d0', charSpacing: 400, originX: 'center', originY: 'center' }),
                    new (fabric as any).IText('COLLECTION', { left: cx, top: cy + 30, fontFamily: 'Arial', fontSize: 36, fontWeight: 'normal', fill: '#a7f3d0', charSpacing: 400, originX: 'center', originY: 'center' })
                ];
                break;
            case 'hustle':
                objects = [
                    new (fabric as any).IText('HUSTLE', { left: cx, top: cy, fontFamily: 'Inter', fontSize: 130, fontWeight: 900, fill: '#ffffff', shadow: new (fabric as any).Shadow({ color: '#ea580c', blur: 0, offsetX: 8, offsetY: 8 }), originX: 'center', originY: 'center' })
                ];
                break;
            case 'tattoo_studio':
                objects = [
                    new (fabric as any).IText('Tattoo', { left: cx, top: cy - 30, fontFamily: 'Georgia', fontSize: 80, fontStyle: 'italic', fill: '#ffffff', originX: 'center', originY: 'center' }),
                    new (fabric as any).IText('STUDIO', { left: cx, top: cy + 40, fontFamily: 'Courier New', fontSize: 34, fontWeight: 'bold', fill: '#9ca3af', originX: 'center', originY: 'center', charSpacing: 200 })
                ];
                break;
            case 'talk_to_us':
                objects = [
                    new (fabric as any).IText('TALK', { left: cx, top: cy - 40, fontFamily: 'Inter', fontSize: 70, fontWeight: 900, fill: '#3b82f6', originX: 'center', originY: 'center' }),
                    new (fabric as any).IText('TO US', { left: cx, top: cy + 30, fontFamily: 'Inter', fontSize: 70, fontWeight: 900, fill: '#ffffff', originX: 'center', originY: 'center' })
                ];
                break;
            case 'coming_soon':
                objects = [
                    new (fabric as any).IText('COMING SOON', { left: cx, top: cy, fontFamily: 'Courier New', fontSize: 48, fontWeight: 'bold', fill: '#14b8a6', charSpacing: 100, shadow: new (fabric as any).Shadow({ color: 'rgba(20, 184, 166, 0.5)', blur: 15 }), originX: 'center', originY: 'center' })
                ];
                break;
            case 'play':
                objects = [
                    new (fabric as any).IText('PLAY', { left: cx, top: cy, fontFamily: 'Arial', fontSize: 130, fontWeight: 900, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 3, shadow: new (fabric as any).Shadow({ color: '#3b82f6', blur: 0, offsetX: -6, offsetY: 6 }), originX: 'center', originY: 'center' })
                ];
                break;
            case 'dapper':
                objects = [
                    new (fabric as any).IText('DAPPER', { left: cx, top: cy, fontFamily: 'Georgia', fontSize: 90, fontWeight: 'normal', fill: '#ffffff', charSpacing: 50, originX: 'center', originY: 'center' })
                ];
                break;
            default:
                break;
        }

        objects.forEach(obj => c.add(obj));
        if (objects.length > 0) {
            c.setActiveObject(objects[0]);
        }
        c.renderAll();
        pushHistory();
        syncState();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;
            setUploadedFiles(prev => [url, ...prev]);
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
                img.scaleToWidth(Math.min(600, c.width!));
            } else {
                img.scale(Math.min(600 / (img.width || 1), 1));
            }
            img.set({ left: c.width! / 2, top: c.height! / 2, originX: 'center', originY: 'center' });
            addObj(img);
        });
    };

    const addSvgGraphic = (url: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        (fabric as any).loadSVGFromURL(url, (objects: any, options: any) => {
            const svgData = (fabric as any).util.groupSVGElements(objects, options);
            svgData.scaleToWidth(Math.min(300, c.width!));
            svgData.set({ left: c.width! / 2, top: c.height! / 2, originX: 'center', originY: 'center', name: 'Vector Graphic' });
            addObj(svgData);
        }, undefined, { crossOrigin: 'anonymous' });
    };

    const addSticker = (url: string) => {
        addStockPhoto(url); // Stickers are technically transparent PNGs, so addStockPhoto logic works perfectly
    };

    // --- Autosave & Loading Logic ---
    // Use refs for stable event listeners in canvas to avoid constant rebinding.
    const activeProjectRef = useRef<string | null>(null);
    const activeFolderRef = useRef<string | null>(null);
    const isHydratingRef = useRef<boolean>(false);
    useEffect(() => { activeProjectRef.current = activeProjectId; }, [activeProjectId]);
    useEffect(() => { activeFolderRef.current = activeFolder; }, [activeFolder]);

    const handleFolderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;

            const mockupJson = {
                version: '6.0.0',
                objects: [
                    { type: 'image', src: url, left: 540, top: 540, originX: 'center', originY: 'center', scaleX: 0.5, scaleY: 0.5 }
                ]
            };

            const newId = `upload_${Date.now()}`;
            const newProject = {
                id: newId,
                name: file.name || 'Uploaded Design',
                json: mockupJson,
                thumbnail: url,
                folderId: activeFolderRef.current,
                updatedAt: new Date().toISOString()
            };

            setSavedProjects(prev => {
                const up = [newProject, ...prev];
                try { localStorage.setItem('canva_clone_projects', JSON.stringify(up)); } catch (e) { }
                return up;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const saveCurrentDesign = useCallback(() => {
        if (!fabricCanvasRef.current || isHydratingRef.current) return;
        const json = fabricCanvasRef.current.toJSON();

        if (json.objects && json.objects.length === 0) return;

        const thumbnail = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 0.2 });

        setSavedProjects(prev => {
            let updated = [...prev];
            const currentId = activeProjectRef.current;
            const existingIdx = updated.findIndex((p: any) => p.id === currentId);

            if (currentId && existingIdx >= 0) {
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    json,
                    thumbnail,
                    updatedAt: new Date().toISOString()
                };
            } else {
                const newId = `proj_${Date.now()}`;
                const newProject = {
                    id: newId,
                    name: `Design ${updated.length + 1}`,
                    json,
                    thumbnail,
                    folderId: activeFolderRef.current,
                    updatedAt: new Date().toISOString()
                };
                setActiveProjectId(newId);
                updated = [newProject, ...updated];
            }
            try { localStorage.setItem('canva_clone_projects', JSON.stringify(updated)); } catch (e) { }
            return updated;
        });
    }, []);

    const loadProject = useCallback((proj: any) => {
        if (!fabricCanvasRef.current || !proj || !proj.json) return;

        isHydratingRef.current = true;
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.loadFromJSON(proj.json).then(() => {
            fabricCanvasRef.current?.renderAll();
            setActiveProjectId(proj.id);
            setActiveFolder(proj.folderId || null);
            pushHistory();
            setTimeout(() => { isHydratingRef.current = false; }, 200);
        }).catch((err: any) => {
            console.error("Failed to load project:", err);
            isHydratingRef.current = false;
        });
    }, [pushHistory]);

    useEffect(() => {
        try {
            const data = localStorage.getItem('canva_clone_projects');
            if (data) setSavedProjects(JSON.parse(data));

            const folderData = localStorage.getItem('canva_clone_folders');
            if (folderData) setSavedFolders(JSON.parse(folderData));
        } catch (e) { }
    }, []);

    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        let timeout: NodeJS.Timeout;
        const onModify = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                saveCurrentDesign();
            }, 3000);
        };

        canvas.on('object:modified', onModify);
        canvas.on('object:added', onModify);
        canvas.on('object:removed', onModify);

        return () => {
            canvas.off('object:modified', onModify);
            canvas.off('object:added', onModify);
            canvas.off('object:removed', onModify);
            clearTimeout(timeout);
        };
    }, [saveCurrentDesign]);

    const stockPhotos = [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
        'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=400',
    ];

    const proStickers = [
        'https://cdn3.iconfinder.com/data/icons/social-media-black-white-2/512/YOUTUBE_icon-icons.com_71110.png',
        'https://cdn3.iconfinder.com/data/icons/social-media-black-white-2/512/INSTAGRAM_icon-icons.com_71111.png',
        'https://cdn3.iconfinder.com/data/icons/social-media-black-white-2/512/TIKTOK_icon-icons.com_71109.png',
        'https://cdn3.iconfinder.com/data/icons/social-media-black-white-2/512/1-PINTEREST_icon-icons.com_71113.png',
        'https://cdn3.iconfinder.com/data/icons/popular-services-brands/512/whatsapp-512.png',
        'https://cdn3.iconfinder.com/data/icons/social-media-black-white-2/1024/facebook-1024.png',
    ];

    const addSvgGraphicString = async (svgString: string) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        try {
            const result = await (fabric as any).loadSVGFromString(svgString);
            const objects = result.objects;
            const options = result.options;
            if (!objects || !objects.length) return;
            const svgData = (fabric as any).util.groupSVGElements(objects, options);
            svgData.scaleToWidth(150);
            svgData.set({ left: c.width! / 2, top: c.height! / 2, originX: 'center', originY: 'center', name: 'Vector Graphic' });
            addObj(svgData);
        } catch (error) {
            console.error("Failed mounting SVG:", error);
        }
    };

    const graphicsLibrary = {
        gradients: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="#FF512F"/><stop offset="100%" stop-color="#DD2476"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g1)"/></svg>', label: 'Sunset Circle' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0" y1="100" x2="100" y2="0"><stop offset="0%" stop-color="#1FA2FF"/><stop offset="100%" stop-color="#12D8FA"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(#g2)"/></svg>', label: 'Ocean Blob' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0" y1="50" x2="100" y2="50"><stop offset="0%" stop-color="#ff9a9e"/><stop offset="100%" stop-color="#fecfef"/></linearGradient></defs><polygon points="50,0 100,25 100,75 50,100 0,75 0,25" fill="url(#g3)"/></svg>', label: 'Pastel Gem' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="50" y1="0" x2="50" y2="100"><stop offset="0%" stop-color="#a18cd1"/><stop offset="100%" stop-color="#fbc2eb"/></linearGradient></defs><path d="M 50 0 L 100 50 L 50 100 L 0 50 Z" fill="url(#g4)"/></svg>', label: 'Dream Diamond' }
        ],
        social: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="25" fill="#f09433"/><path d="M25 0h50c13.8 0 25 11.2 25 25v50c0 13.8-11.2 25-25 25H25C11.2 100 0 88.8 0 75V25C0 11.2 11.2 0 25 0zm25 24c-14.4 0-26 11.6-26 26s11.6 26 26 26 26-11.6 26-26-11.6-26-26-26zm0 43c-9.4 0-17-7.6-17-17s7.6-17 17-17 17 7.6 17 17-7.6 17-17 17zm32-43c0-3.3-2.7-6-6-6s-6 2.7-6 6 2.7 6 6 6 6-2.7 6-6z" fill="#FFF"/></svg>', label: 'Instagram' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#24A1DE"/><path d="M100 20L0 60l30 10 10 30 15-20 25 20L100 20z" fill="#FFF"/></svg>', label: 'Telegram' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#1DA1F2"/><path d="M75 35c-2 1-4 1-6 2 2-1 4-3 4-6-2 1-4 2-7 3-2-2-5-3-8-3-6 0-11 5-11 11 0 1 0 2 0 2-9 0-17-5-22-11 0 1-1 3-1 4 0 4 2 7 5 9-2 0-4-1-6-1 0 6 4 11 10 12-1 0-2 0-3 0-1 0-1 0-2 0 1 5 6 9 12 9-4 3-10 5-15 5h-3c6 4 13 6 20 6 25 0 38-20 38-38v-2c3-2 5-4 7-7z" fill="#FFF"/></svg>', label: 'Twitter' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#5865F2"/><path d="M70 35H30c-3 0-5 2-5 5v20c0 3 2 5 5 5h40c3 0 5-2 5-5V40c0-3-2-5-5-5zM40 55a5 5 0 110-10 5 5 0 010 10zm20 0a5 5 0 110-10 5 5 0 010 10z" fill="#FFF"/></svg>', label: 'Discord' }
        ],
        illustrations: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M50 10A30 30 0 1 0 50 70A30 30 0 1 0 50 10ZM35 100H65V110H35Z" fill="#FCD34D"/><path d="M45 80H55V95H45Z" fill="#9CA3AF"/></svg>', label: 'Idea Bulb' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#EF4444"/><circle cx="50" cy="50" r="30" fill="#FFF"/><circle cx="50" cy="50" r="15" fill="#EF4444"/></svg>', label: 'Target' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><rect x="10" y="50" width="20" height="40" fill="#3B82F6"/><rect x="40" y="30" width="20" height="60" fill="#10B981"/><rect x="70" y="10" width="20" height="80" fill="#8B5CF6"/></svg>', label: 'Growth' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M10 90 L 90 90 M 30 90 L 30 70 M 50 90 L 50 40 M 70 90 L 70 10 M 20 70 L 40 50 L 60 60 L 90 10" stroke="#F59E0B" stroke-width="8" fill="none"/></svg>', label: 'Strategy' }
        ],
        bright_food: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 20 50 C 20 20 80 20 80 50 Z" fill="#F59E0B"/><path d="M 20 55 L 80 55 M 20 65 L 80 65" stroke="#10B981" stroke-width="5"/><path d="M 25 70 L 75 70 C 75 80 25 80 25 70 Z" fill="#D97706"/></svg>', label: 'Burger' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 50 20 L 10 90 L 90 90 Z" fill="#FCD34D"/><path d="M 50 20 L 10 90 L 90 90 Z" fill="none" stroke="#D97706" stroke-width="5"/><circle cx="45" cy="55" r="5" fill="#EF4444"/><circle cx="55" cy="70" r="5" fill="#EF4444"/></svg>', label: 'Pizza' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10 Z M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35 Z" fill="#F472B6"/><circle cx="30" cy="50" r="3" fill="#FFF"/><circle cx="70" cy="50" r="3" fill="#FFF"/><circle cx="50" cy="20" r="3" fill="#FFF"/></svg>', label: 'Donut' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 30 40 A 20 20 0 1 1 70 40 A 20 20 0 1 1 30 40" fill="#6EE7B7"/><path d="M 30 45 L 50 90 L 70 45" fill="#D97706"/></svg>', label: 'Ice Cream' }
        ],
        pastel_travel: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 10 50 L 40 40 L 60 10 L 70 10 L 65 40 L 90 40 C 95 40 100 45 100 50 C 100 55 95 60 90 60 L 65 60 L 70 90 L 60 90 L 40 60 L 10 50 Z" fill="#3B82F6"/></svg>', label: 'Plane' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 20 20 L 80 20 L 80 90 L 20 90 Z" fill="#10B981"/><path d="M 30 20 L 70 20 L 70 10 L 30 10 Z" fill="#059669"/><path d="M 40 20 L 40 90 M 60 20 L 60 90" stroke="#047857" stroke-width="4"/></svg>', label: 'Luggage' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 50 10 C 20 10 20 50 50 90 C 80 50 80 10 50 10 Z" fill="#EF4444"/><circle cx="50" cy="40" r="15" fill="#FFF"/></svg>', label: 'Pin' }
        ],
        organic_summer: [
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#FBBF24"/><path d="M 50 0 L 50 15 M 50 100 L 50 85 M 0 50 L 15 50 M 100 50 L 85 50 M 15 15 L 25 25 M 85 85 L 75 75 M 85 15 L 75 25 M 15 85 L 25 75" stroke="#FBBF24" stroke-width="8" stroke-linecap="round"/></svg>', label: 'Sun' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 50 100 Q 40 60 50 20" stroke="#8B5CF6" fill="none" stroke-width="8"/><path d="M 50 30 Q 30 50 10 50M 50 30 Q 70 50 90 50M 50 20 Q 20 20 20 0M 50 20 Q 80 20 80 0" stroke="#10B981" fill="none" stroke-width="12" stroke-linecap="round"/></svg>', label: 'Palm Tree' },
            { type: 'svg', svg: '<svg viewBox="0 0 100 100"><path d="M 10 30 L 90 30 C 90 80 50 100 50 100 C 50 100 10 80 10 30 Z" fill="#EF4444"/><path d="M 30 50 A 5 5 0 1 0 30 51 M 50 60 A 5 5 0 1 0 50 61 M 70 50 A 5 5 0 1 0 70 51" stroke="#000" stroke-width="6" stroke-linecap="round"/></svg>', label: 'Watermelon' }
        ]
    };

    const addPathShape = (pathDef: string, customScale = 1) => {
        const c = fabricCanvasRef.current;
        if (!c) return;
        try {
            const path = new (fabric as any).Path(pathDef, {
                left: c.width! / 2,
                top: c.height! / 2,
                originX: 'center',
                originY: 'center',
                fill: '#6366f1',
            });
            path.scaleToWidth(120 * customScale);
            addObj(path);
        } catch (e) {
            console.error('Failed to parse path', e);
        }
    };

    const shapeLibrary = {
        lines: [
            { type: 'path', path: 'M 0 50 L 100 50', label: 'Solid', scale: 2 },
            { type: 'path', path: 'M 0 50 L 100 50', label: 'Dashed', strokeDashArray: [5, 5], scale: 2 },
            { type: 'path', path: 'M 0 50 L 100 50', label: 'Dotted', strokeDashArray: [2, 2], scale: 2 },
            { type: 'path', path: 'M 0 50 L 80 50 L 80 40 L 100 55 L 80 70 L 80 60 L 0 60 Z', label: 'Arrowhead', scale: 2 },
            { type: 'path', path: 'M 20 40 L 20 50 L 80 50 L 80 40 L 100 55 L 80 70 L 80 60 L 20 60 L 20 70 L 0 55 Z', label: 'Double', scale: 2 }
        ],
        basic: [
            { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], label: 'Square' },
            { type: 'path', path: 'M 20 0 L 80 0 C 91 0 100 9 100 20 L 100 80 C 100 91 91 100 80 100 L 20 100 C 9 100 0 91 0 80 L 0 20 C 0 9 9 0 20 0 Z', label: 'Rounded' },
            { type: 'path', path: 'M 50 0 A 50 50 0 1 1 49.9 0 Z', label: 'Circle' },
            { type: 'polygon', points: [{ x: 50, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], label: 'Triangle' },
            { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }], label: 'Inverted' }
        ],
        polygons: [
            { type: 'polygon', points: [{ x: 50, y: 0 }, { x: 100, y: 38 }, { x: 81, y: 100 }, { x: 19, y: 100 }, { x: 0, y: 38 }], label: 'Pentagon' },
            { type: 'polygon', points: [{ x: 50, y: 0 }, { x: 100, y: 25 }, { x: 100, y: 75 }, { x: 50, y: 100 }, { x: 0, y: 75 }, { x: 0, y: 25 }], label: 'Hexagon' },
            { type: 'polygon', points: [{ x: 50, y: 0 }, { x: 89, y: 19 }, { x: 99, y: 61 }, { x: 72, y: 97 }, { x: 28, y: 97 }, { x: 1, y: 61 }, { x: 11, y: 19 }], label: 'Heptagon' },
            { type: 'polygon', points: [{ x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 }], label: 'Octagon' }
        ],
        stars: [
            { type: 'path', path: 'M 50 0 L 65 35 L 100 50 L 65 65 L 50 100 L 35 65 L 0 50 L 35 35 Z', label: '4-Point' },
            { type: 'path', path: 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', label: '5-Point' },
            { type: 'path', path: 'M 50 0 L 64 25 L 93 25 L 79 50 L 93 75 L 64 75 L 50 100 L 36 75 L 7 75 L 21 50 L 7 25 L 36 25 Z', label: '6-Point' },
            { type: 'path', path: 'M 50 0 L 59 25 L 85 15 L 75 41 L 100 50 L 75 59 L 85 85 L 59 75 L 50 100 L 41 75 L 15 85 L 25 59 L 0 50 L 25 41 L 15 15 L 41 25 Z', label: '8-Point' }
        ],
        arrows: [
            { type: 'polygon', points: [{ x: 0, y: 35 }, { x: 60, y: 35 }, { x: 60, y: 15 }, { x: 100, y: 50 }, { x: 60, y: 85 }, { x: 60, y: 65 }, { x: 0, y: 65 }], label: 'Right' },
            { type: 'polygon', points: [{ x: 100, y: 35 }, { x: 40, y: 35 }, { x: 40, y: 15 }, { x: 0, y: 50 }, { x: 40, y: 85 }, { x: 40, y: 65 }, { x: 100, y: 65 }], label: 'Left' },
            { type: 'polygon', points: [{ x: 35, y: 100 }, { x: 35, y: 40 }, { x: 15, y: 40 }, { x: 50, y: 0 }, { x: 85, y: 40 }, { x: 65, y: 40 }, { x: 65, y: 100 }], label: 'Up' },
            { type: 'polygon', points: [{ x: 35, y: 0 }, { x: 35, y: 60 }, { x: 15, y: 60 }, { x: 50, y: 100 }, { x: 85, y: 60 }, { x: 65, y: 60 }, { x: 65, y: 0 }], label: 'Down' },
            { type: 'polygon', points: [{ x: 25, y: 35 }, { x: 0, y: 50 }, { x: 25, y: 65 }, { x: 25, y: 45 }, { x: 75, y: 45 }, { x: 75, y: 65 }, { x: 100, y: 50 }, { x: 75, y: 35 }, { x: 75, y: 55 }, { x: 25, y: 55 }], label: 'Db-Horiz' }
        ],
        flowchart: [
            { type: 'polygon', points: [{ x: 0, y: 15 }, { x: 100, y: 15 }, { x: 100, y: 85 }, { x: 0, y: 85 }], label: 'Process' },
            { type: 'path', path: 'M 20 15 L 80 15 C 91 15 100 24 100 50 C 100 76 91 85 80 85 L 20 85 C 9 85 0 76 0 50 C 0 24 9 15 20 15 Z', label: 'Terminator' },
            { type: 'polygon', points: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }], label: 'Decision' },
            { type: 'polygon', points: [{ x: 20, y: 15 }, { x: 100, y: 15 }, { x: 80, y: 85 }, { x: 0, y: 85 }], label: 'Data Box' }
        ],
        bubbles: [
            { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 70 }, { x: 40, y: 70 }, { x: 10, y: 100 }, { x: 20, y: 70 }, { x: 0, y: 70 }], label: 'Rect Chat' },
            { type: 'path', path: 'M 20 0 L 80 0 C 91 0 100 9 100 20 L 100 60 C 100 71 91 80 80 80 L 40 80 L 10 100 L 20 80 C 9 80 0 71 0 60 L 0 20 C 0 9 9 0 20 0 Z', label: 'Rounded' },
            { type: 'path', path: 'M 50 100 C 22.4 100 0 81.3 0 58.3 C 0 49.3 3.6 41 9.5 34 C 8.6 15.6 23.9 0 42.9 0 C 56.6 0 68.6 8.5 74.2 20.8 C 89.2 21.6 101.4 34 101.4 49.3 C 101.4 69.3 80.9 90.7 50 100 M 10 90 A 5 5 0 1 1 10 89.9 M 20 100 A 3 3 0 1 1 20 99.9', label: 'Thought' },
            { type: 'path', path: 'M 10 20 L 90 20 L 90 70 L 30 70 L 10 50 Z', label: 'Pointed' }
        ],
        clouds: [
            { type: 'path', path: 'M 30 90 C 10 90 0 75 0 60 C 0 45 15 35 25 40 C 28 20 50 10 70 25 C 90 15 100 35 100 55 C 100 80 80 90 60 90 Z', label: 'Fluffy 1' },
            { type: 'path', path: 'M 20 80 C 5 80 0 60 10 50 C 5 30 25 15 45 25 C 55 5 85 10 95 30 C 105 50 95 80 75 80 Z', label: 'Fluffy 2' },
            { type: 'path', path: 'M 25 75 C 10 75 5 60 15 50 C 5 35 20 20 40 25 C 50 5 80 15 85 40 C 100 45 95 75 75 75 Z', label: 'Weather' }
        ],
        hearts_banners: [
            { type: 'path', path: 'M 50 100 C 50 100 0 65 0 30 C 0 13 13 0 30 0 C 40 0 47 5 50 12 C 53 5 60 0 70 0 C 87 0 100 13 100 30 C 100 65 50 100 50 100 Z', label: 'Heart' },
            { type: 'polygon', points: [{ x: 0, y: 20 }, { x: 100, y: 20 }, { x: 100, y: 80 }, { x: 0, y: 80 }, { x: 15, y: 50 }], label: 'Ribbon L' },
            { type: 'polygon', points: [{ x: 100, y: 20 }, { x: 0, y: 20 }, { x: 0, y: 80 }, { x: 100, y: 80 }, { x: 85, y: 50 }], label: 'Ribbon R' },
            { type: 'path', path: 'M 50 0 C 50 0 0 40 0 70 C 0 87 13 100 30 100 C 47 100 50 85 50 85 C 50 85 53 100 70 100 C 87 100 100 87 100 70 C 100 40 50 0 50 0 Z', label: 'Teardrop' }
        ],
        cogs_abstract: [
            { type: 'path', path: 'M 50 15 A 35 35 0 1 1 49.9 15 M 50 0 L 60 10 L 70 5 L 75 15 L 85 15 L 85 25 L 95 30 L 90 40 L 100 50 L 90 60 L 95 70 L 85 75 L 85 85 L 75 85 L 70 95 L 60 90 L 50 100 L 40 90 L 30 95 L 25 85 L 15 85 L 15 75 L 5 70 L 10 60 L 0 50 L 10 40 L 5 30 L 15 25 L 15 15 L 25 15 L 30 5 L 40 10 Z', label: 'Cog' },
            { type: 'polygon', points: [{ x: 40, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 40 }, { x: 100, y: 40 }, { x: 100, y: 60 }, { x: 60, y: 60 }, { x: 60, y: 100 }, { x: 40, y: 100 }, { x: 40, y: 60 }, { x: 0, y: 60 }, { x: 0, y: 40 }, { x: 40, y: 40 }], label: 'Cross' },
            { type: 'path', path: 'M 50 0 C 70 0 75 25 100 25 C 100 45 75 50 75 75 C 55 75 50 100 25 100 C 25 80 50 75 50 50 C 30 50 25 25 0 25 C 0 5 25 0 25 25 C 45 25 50 0 50 0 Z', label: 'Flower' },
            { type: 'path', path: 'M 50 0 L 61 7 L 74 2 L 79 14 L 92 14 L 92 27 L 103 35 L 94 45 L 100 57 L 88 64 L 88 77 L 75 79 L 68 91 L 56 86 L 46 96 L 36 86 L 24 91 L 17 79 L 4 77 L 4 64 L -8 57 L -2 45 L -11 35 L 0 27 L 0 14 L 13 14 L 18 2 L 31 7 Z', label: 'Badge' }
        ]
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

    // =========================================================================
    // VIEW 2: DEDICATED PASSPORT PHOTO STUDIO
    // =========================================================================
    if (currentView === 'passport-studio') {
        const config = passportDimensions[passportPaperSize];
        return (
            <div className="flex flex-col h-screen w-screen bg-[#0c0c0e] text-white overflow-hidden font-sans">
                <header className="h-14 bg-[#121217] border-b border-[#1e1e24] flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold bg-[#1a1a22] hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-[#262633] transition">
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
        { id: 'templates', icon: <LayoutTemplate size={18} />, label: 'Templates' },
        { id: 'elements', icon: <Square size={18} />, label: 'Elements' },
        { id: 'text', icon: <Type size={18} />, label: 'Text' },
        { id: 'brand', icon: <Palette size={18} />, label: 'Brand' },
        { id: 'uploads', icon: <ImagePlus size={18} />, label: 'Uploads' },
        { id: 'tools', icon: <Wand2 size={18} />, label: 'Tools' },
        { id: 'projects', icon: <LayersIcon size={18} />, label: 'Projects' }
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

                <aside className="w-[340px] bg-[#14141B] border-r border-zinc-800/80 flex flex-col shrink-0 overflow-y-auto relative z-30 shadow-2xl">
                    <div className="p-4 border-b border-zinc-800/60 bg-[#14141B]/95 backdrop-blur z-10 sticky top-0">
                        <h3 className="text-[15px] font-extrabold text-white mb-3 tracking-wide flex items-center justify-between">
                            <span className="capitalize">{activeTab}</span>
                            {activeTab === 'brand' && <span className="text-[9px] bg-yellow-500 text-yellow-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pro</span>}
                        </h3>
                        {['templates', 'elements', 'projects', 'apps', 'uploads', 'text'].includes(activeTab) && (
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={activeTab === 'text' ? 'Search fonts and combinations' : `Search ${activeTab}…`}
                                    className="w-full bg-[#1e1e26] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* TEMPLATES */}
                        {activeTab === 'templates' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-bold text-zinc-300">Professional Templates</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {dashTemplates.map((t, i) => (
                                            <button key={i} onClick={() => loadTemplate(t.key)} className="relative aspect-[3/4] bg-[#1e1e26] rounded-xl overflow-hidden group border border-zinc-800 hover:border-indigo-500 transition-all shadow-sm">
                                                <img src={t.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" alt={t.label} loading="lazy" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <span className="text-[11px] font-bold text-white tracking-wider truncate">{t.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ELEMENTS */}
                        {activeTab === 'elements' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 relative">
                                {!activeElementsCategory ? (
                                    <>
                                        {/* Recommended For You */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-xs font-bold text-zinc-300">Recommended for you</h4>
                                                <button className="text-[10px] font-bold text-zinc-500 hover:text-white transition">See All</button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => addStockPhoto('https://images.unsplash.com/photo-1542314831-c5a4d407e997?w=400')} className="aspect-square bg-[#1e1e26] rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 group relative">
                                                    <img src="https://images.unsplash.com/photo-1542314831-c5a4d407e997?w=400" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" alt="Rec" />
                                                </button>
                                                <button onClick={addStar} className="aspect-square bg-[#1e1e26] rounded-xl flex items-center justify-center border border-zinc-800 hover:border-indigo-500 group">
                                                    <Star size={32} className="text-amber-400 group-hover:scale-110 transition-transform" fill="currentColor" />
                                                </button>
                                                <button onClick={() => addStockPhoto('https://images.unsplash.com/photo-1618220179428-22790b461013?w=400')} className="aspect-square bg-[#1e1e26] rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 group relative">
                                                    <img src="https://images.unsplash.com/photo-1618220179428-22790b461013?w=400" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" alt="Rec" />
                                                </button>
                                                <button onClick={addCircle} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'circle')} className="aspect-square bg-[#1e1e26] rounded-xl flex items-center justify-center border border-zinc-800 hover:border-indigo-500 group">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-500 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20" />
                                                </button>
                                                <button onClick={() => addStockPhoto('https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400')} className="aspect-square bg-[#1e1e26] rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 group relative">
                                                    <img src="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" alt="Rec" />
                                                </button>
                                                <button onClick={addRect} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'rect')} className="aspect-square bg-[#1e1e26] rounded-xl flex items-center justify-center border border-zinc-800 hover:border-indigo-500 group">
                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-700 border-2 border-zinc-500 group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Browse Categories */}
                                        <div>
                                            <h4 className="text-xs font-bold text-zinc-300 mb-3">Browse categories</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'shapes', label: 'Shapes', icon: <Square size={22} className="text-blue-400" fill="currentColor" opacity={0.2} /> },
                                                    { id: 'graphics', label: 'Graphics', icon: <Sparkles size={22} className="text-amber-400" /> },
                                                    { id: 'stickers', label: 'Stickers', icon: <Info size={22} className="text-emerald-400" /> },
                                                    { id: 'photos', label: 'Photos', icon: <ImageIcon size={22} className="text-rose-400" /> },
                                                    { id: 'videos', label: 'Videos', icon: <Film size={22} className="text-indigo-400" /> },
                                                    { id: 'audio', label: 'Audio', icon: <Music size={22} className="text-purple-400" /> },
                                                    { id: 'animations', label: 'Animations', icon: <LayersIcon size={22} className="text-pink-400" /> },
                                                    { id: 'charts', label: 'Charts', icon: <BarChart size={22} className="text-green-400" /> },
                                                    { id: 'forms', label: 'Forms', icon: <CheckSquare size={22} className="text-teal-400" /> },
                                                    { id: 'tables', label: 'Tables', icon: <LayoutGrid size={22} className="text-sky-400" /> },
                                                    { id: 'frames', label: 'Frames', icon: <BoxSelect size={22} className="text-fuchsia-400" /> },
                                                    { id: 'grids', label: 'Grids', icon: <Grid3X3 size={22} className="text-violet-400" /> },
                                                ].map(cat => (
                                                    <button key={cat.id} onClick={() => setActiveElementsCategory(cat.id)} className="bg-[#1e1e26] border border-zinc-800/80 hover:border-indigo-500 hover:bg-[#252530] rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all group shadow-sm">
                                                        <div className="w-12 h-12 rounded-full border border-zinc-700/50 bg-[#17171e] group-hover:bg-[#1f1f2a] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            {cat.icon}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-zinc-300">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <button onClick={() => setActiveElementsCategory(null)} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white mb-4 transition-colors">
                                            <ArrowLeft size={14} /> Back to Elements
                                        </button>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-white capitalize">{activeElementsCategory}</h4>
                                        </div>

                                        {activeElementsCategory === 'shapes' && (
                                            <div className="space-y-6 pb-20">
                                                {Object.entries(shapeLibrary).map(([category, shapes]) => (
                                                    <div key={category}>
                                                        <h4 className="text-xs font-bold text-zinc-300 capitalize mb-3 border-b border-zinc-800 pb-2 flex justify-between">
                                                            {category} <span className="text-[9px] text-zinc-500 font-normal hover:text-white cursor-pointer transition">See all</span>
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {shapes.map((shape, i) => {
                                                                const sPoints = (shape as any).points;
                                                                const sPath = (shape as any).path;
                                                                const sDash = (shape as any).strokeDashArray;
                                                                const sScale = (shape as any).scale || 1.5;
                                                                return (
                                                                    <button key={i} onClick={() => {
                                                                        if (shape.type === 'polygon' && sPoints) {
                                                                            const poly = new (fabric as any).Polygon(sPoints, { left: 540, top: 540, fill: '#6366f1', originX: 'center', originY: 'center' });
                                                                            poly.scaleToWidth(120);
                                                                            addObj(poly);
                                                                        } else if (shape.type === 'path' && sPath) {
                                                                            addPathShape(sPath, sScale);
                                                                        }
                                                                    }} className="bg-[#1e1e26] border border-zinc-800 hover:border-indigo-500/50 rounded-xl py-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#262633] group overflow-hidden">
                                                                        <div className="text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all flex items-center justify-center h-8 w-8">
                                                                            <svg viewBox="-5 -5 110 110" className="w-full h-full fill-current">
                                                                                {shape.type === 'polygon' ? (
                                                                                    <polygon points={sPoints?.map((p: any) => `${p.x},${p.y}`).join(' ')} />
                                                                                ) : (
                                                                                    <path d={sPath} stroke={category === 'lines' ? "currentColor" : "none"} strokeWidth={category === 'lines' ? "8" : "0"} fill={category === 'lines' ? "none" : "currentColor"} strokeDasharray={sDash ? sDash.join(',') : 'none'} strokeLinecap={category === 'lines' ? "round" : "butt"} />
                                                                                )}
                                                                            </svg>
                                                                        </div>
                                                                        <span className="text-[9px] font-semibold text-zinc-500 group-hover:text-zinc-300 text-center">{shape.label}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeElementsCategory === 'photos' && (
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {stockPhotos.map((url, i) => (
                                                    <button key={i} onClick={() => addStockPhoto(url)} draggable onDragStart={(e) => { e.dataTransfer.setData('fabricType', 'photo'); e.dataTransfer.setData('fabricUrl', url); }} className="aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-400 transition-all group">
                                                        <img src={url} alt="stock" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {activeElementsCategory === 'graphics' && (
                                            <div className="space-y-6 pb-20">
                                                {Object.entries(graphicsLibrary).map(([category, items]) => (
                                                    <div key={category}>
                                                        <h4 className="text-xs font-bold text-zinc-300 capitalize mb-3 border-b border-zinc-800 pb-2 flex justify-between">
                                                            {category.replace('_', ' ')} <span className="text-[9px] text-zinc-500 font-normal hover:text-white cursor-pointer transition">See all</span>
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {items.map((item, i) => {
                                                                return (
                                                                    <button key={i} onClick={() => {
                                                                        if (item.type === 'image' && (item as any).url) {
                                                                            addStockPhoto((item as any).url);
                                                                        } else if (item.type === 'path' && (item as any).path) {
                                                                            addPathShape((item as any).path, (item as any).scale || 1.5);
                                                                        } else if (item.type === 'svg' && (item as any).svg) {
                                                                            addSvgGraphicString((item as any).svg);
                                                                        }
                                                                    }} className="bg-[#1e1e26] border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-2 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#262633] group overflow-hidden h-24">
                                                                        <div className="w-10 h-10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                                                            {item.type === 'image' ? (
                                                                                <img src={(item as any).url} alt={item.label} className={`w-full h-full ${category === 'gradients' ? 'object-cover rounded-md' : 'object-contain filter drop-shadow-md'}`} loading="lazy" />
                                                                            ) : item.type === 'svg' ? (
                                                                                <div dangerouslySetInnerHTML={{ __html: (item as any).svg }} className="w-full h-full drop-shadow-md flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
                                                                            ) : (
                                                                                <svg viewBox="-5 -5 110 110" className="w-full h-full fill-indigo-400 drop-shadow-md">
                                                                                    <path d={(item as any).path} />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[9px] font-semibold text-zinc-500 group-hover:text-zinc-300 text-center leading-tight truncate w-full px-1">{item.label}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeElementsCategory === 'stickers' && (
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {proStickers.map((url: string, i: number) => (
                                                    <button key={i} onClick={() => addSticker(url)} className="aspect-square bg-[#0f0f13] rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-400 p-2 flex items-center justify-center transition-all group">
                                                        <img src={url} alt="sticker" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-xl" loading="lazy" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {['videos', 'audio', 'animations', 'charts', 'forms', 'tables', 'frames', 'grids'].includes(activeElementsCategory) && (
                                            <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-white/[0.02]">
                                                <Sparkles size={24} className="mx-auto text-indigo-400 mb-2 opacity-50" />
                                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Use the search bar above to unlock millions of pro {activeElementsCategory} and vectors.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TEXT */}
                        {activeTab === 'text' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">

                                {/* Primary Actions */}
                                <div className="space-y-2 relative">
                                    <button onClick={addHeading} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'heading')} className="w-full py-2.5 bg-[#8b3dff] hover:bg-[#7b2cfa] border border-[#7b2cfa] rounded-xl flex flex-col items-center justify-center transition-all shadow-md group">
                                        <span className="font-bold text-[13px] text-white group-hover:scale-[1.02] transition-transform">Add a text box</span>
                                    </button>
                                    <button onClick={() => setIsMagicWriteOpen(!isMagicWriteOpen)} className="w-full py-2 bg-[#1e1e26] border border-zinc-800 hover:bg-[#252530] hover:border-[#8b3dff]/30 rounded-xl flex items-center justify-center gap-2 transition-all group">
                                        <Sparkles size={14} className="text-[#8b3dff]" />
                                        <span className="font-semibold text-xs text-zinc-300 group-hover:text-white transition-colors">Magic Write</span>
                                    </button>

                                    {isMagicWriteOpen && (
                                        <div className="absolute left-0 top-20 w-full bg-[#1e1e26] border border-purple-500/50 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-[70] animate-in fade-in zoom-in-95">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={10} /> AI Writer</span>
                                                <button onClick={() => setIsMagicWriteOpen(false)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                                            </div>
                                            <textarea
                                                autoFocus
                                                value={magicWriteText}
                                                onChange={(e) => setMagicWriteText(e.target.value)}
                                                placeholder="Describe the text you want..."
                                                className="w-full h-20 bg-[#141419] border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none mb-3"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (magicWriteText.trim()) {
                                                        addObj(new (fabric as any).IText(magicWriteText, { left: canvasWidth / 2 - 100, top: canvasHeight / 2 - 20, fontSize: 32, fontFamily: 'Inter', fill: '#ffffff', fontWeight: 'bold' }));
                                                        setMagicWriteText('');
                                                        setIsMagicWriteOpen(false);
                                                    }
                                                }}
                                                className="w-full py-2 bg-[#8b3dff] hover:bg-[#7b2cfa] text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                                                <Wand2 size={12} /> Generate
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Default Text Styles */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-zinc-400 mb-2 px-1">Default text styles</h4>
                                    <div className="space-y-1">
                                        <button onClick={addHeading} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'heading')} className="w-full px-3 py-3 bg-transparent hover:bg-[#1e1e26] rounded-xl flex items-center transition-all group">
                                            <span className="font-black text-2xl text-white tracking-tight">Add a heading</span>
                                        </button>
                                        <button onClick={addSubheading} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'subheading')} className="w-full px-3 py-2.5 bg-transparent hover:bg-[#1e1e26] rounded-xl flex items-center transition-all group">
                                            <span className="font-bold text-lg text-zinc-200">Add a subheading</span>
                                        </button>
                                        <button onClick={addBodyText} draggable onDragStart={(e) => e.dataTransfer.setData('fabricType', 'bodytext')} className="w-full px-3 py-2 bg-transparent hover:bg-[#1e1e26] rounded-xl flex items-center transition-all group">
                                            <span className="font-medium text-sm text-zinc-400">Add a little bit of body text</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Font Combinations */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-zinc-400 mb-3 px-1">Font combinations</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div onClick={() => addFontPreset('happy_bday')} className="col-span-2 h-24 bg-pink-500 rounded-xl border border-pink-400 flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:scale-[1.02] transition-all shadow-lg shadow-pink-900/30 group">
                                            <span className="font-serif text-3xl font-bold text-yellow-300 italic -rotate-2 drop-shadow-md group-hover:rotate-0 transition-transform">Happy</span>
                                            <span className="font-sans text-[11px] font-black text-white tracking-[0.2em] uppercase mt-1">BIRTHDAY</span>
                                        </div>
                                        <div onClick={() => addFontPreset('golden_hour')} className="h-28 bg-gradient-to-b from-amber-400 to-orange-500 rounded-xl flex flex-col items-center justify-center hover:scale-[1.02] transition-all cursor-pointer shadow-lg group">
                                            <span className="font-sans text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">GOLDEN</span>
                                            <span className="font-sans text-xl font-bold text-yellow-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">HOUR</span>
                                        </div>
                                        <div onClick={() => addFontPreset('glow')} className="h-28 bg-black rounded-xl border border-pink-500/30 flex flex-col items-center justify-center hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-pink-900/20 group">
                                            <span className="font-sans text-2xl font-black text-white drop-shadow-[0_0_12px_#ec4899]">GLOW</span>
                                        </div>
                                        <div onClick={() => addFontPreset('level_up')} className="col-span-2 h-20 bg-zinc-950 rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group overflow-hidden relative border border-zinc-800">
                                            <span className="font-mono text-2xl font-black text-red-500 drop-shadow-[2px_2px_0_#000000] -translate-y-1 -rotate-3 z-10 group-hover:rotate-0 transition-transform">LEVEL</span>
                                            <span className="font-mono text-2xl font-black text-blue-500 drop-shadow-[2px_2px_0_#000000] translate-y-2 rotate-3 ml-2 z-10 group-hover:rotate-0 transition-transform">UP</span>
                                        </div>
                                        <div onClick={() => addFontPreset('sweet')} className="h-24 bg-[#fdf2f8] rounded-xl flex flex-col items-center justify-center hover:scale-[1.02] transition-all cursor-pointer group">
                                            <span className="font-serif text-3xl font-bold text-pink-500 italic drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)]">Sweet</span>
                                            <span className="font-sans text-[9px] font-black text-black tracking-[0.2em] uppercase mt-0.5">TREATS</span>
                                        </div>
                                        <div onClick={() => addFontPreset('wild_sale')} className="h-24 bg-yellow-400 rounded-xl border-2 border-black flex flex-col items-center justify-center hover:scale-[1.02] transition-all cursor-pointer group">
                                            <span className="font-sans text-2xl font-black text-white px-1 relative -top-1 shadow-black shadow-[2px_2px_0_0_#000] -rotate-3">WILD</span>
                                            <span className="font-sans text-2xl font-black text-red-500 px-1 relative shadow-black shadow-[2px_2px_0_0_#000] rotate-3">SALE</span>
                                        </div>
                                        <div onClick={() => addFontPreset('spring_collection')} className="col-span-2 h-24 bg-emerald-900 rounded-xl flex items-center justify-center flex-col cursor-pointer hover:scale-[1.02] transition-all shadow-lg group">
                                            <span className="font-sans text-xs font-normal text-emerald-200 tracking-[0.3em]">SPRING</span>
                                            <span className="font-sans text-xs font-normal text-emerald-200 tracking-[0.3em] mt-1">COLLECTION</span>
                                        </div>
                                        <div onClick={() => addFontPreset('hustle')} className="h-24 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group">
                                            <span className="font-sans text-xl font-bold text-white drop-shadow-[4px_4px_0_#ea580c] -skew-x-12">HUSTLE</span>
                                        </div>
                                        <div onClick={() => addFontPreset('tattoo_studio')} className="h-24 bg-zinc-900 rounded-xl border border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group">
                                            <span className="font-serif text-2xl font-bold text-white italic">Tattoo</span>
                                            <span className="font-mono text-[9px] font-bold text-zinc-400 tracking-widest mt-1">STUDIO</span>
                                        </div>
                                        <div onClick={() => addFontPreset('talk_to_us')} className="col-span-2 h-20 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] hover:bg-blue-500 transition-all shadow-lg group">
                                            <span className="font-sans text-xl font-black text-white mr-1 -rotate-2 group-hover:rotate-0 transition-transform">TALK</span>
                                            <span className="font-sans text-xl font-black text-black rotate-2 ml-1 group-hover:rotate-0 transition-transform">TO US</span>
                                        </div>
                                        <div onClick={() => addFontPreset('coming_soon')} className="h-20 bg-[#0f172a] rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group border border-teal-900/50">
                                            <span className="font-mono text-xs font-bold text-teal-400 tracking-widest drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]">COMING SOON</span>
                                        </div>
                                        <div onClick={() => addFontPreset('play')} className="h-20 bg-white rounded-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-all group border-b-4 border-r-4 border-black">
                                            <span className="font-sans text-xl font-black text-purple-500 drop-shadow-[-3px_3px_0_#3b82f6]">PLAY</span>
                                        </div>
                                        <div onClick={() => addFontPreset('dapper')} className="col-span-2 h-20 bg-[#18181b] rounded-xl border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-700 hover:scale-[1.02] transition-all group">
                                            <span className="font-serif text-lg font-normal text-white uppercase tracking-[0.2em]">Dapper</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPLOADS */}
                        {activeTab === 'uploads' && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300 h-full flex flex-col pt-1">
                                <input type="file" ref={fileInputRef} accept="image/*,video/*,audio/*" className="hidden" onChange={handleImageUpload} />

                                {/* Search Bar */}
                                <div className="relative group">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search keywords, tags, colour"
                                        className="w-full bg-[#1a1a22] border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all shadow-sm"
                                    />
                                </div>

                                {/* Primary Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-2.5 bg-[#8b3dff] hover:bg-[#7b2cfa] text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        Upload files
                                    </button>
                                    <button className="flex-1 py-2.5 bg-transparent border border-zinc-700/80 hover:bg-zinc-800/80 text-zinc-300 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Monitor size={14} /> Record yourself
                                    </button>
                                </div>

                                {/* Integrations Row */}
                                <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-zinc-800/60">
                                    <button title="Google Drive" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm">
                                        <svg viewBox="0 0 48 48" className="w-4 h-4"><path fill="#FFC107" d="M17 5.8l-8 13.9 11 19.3 8-13.9z" /><path fill="#1976D2" d="M11 41.5L24 19l13 22.5H11z" /><path fill="#4CAF50" d="M39 41.5L28 22.5 17 5.8h11z" /></svg>
                                    </button>
                                    <button title="Dropbox" className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm text-white font-bold text-[10px]">Db</button>
                                    <button title="Instagram" className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm text-white">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </button>
                                    <button title="Facebook" className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm text-white font-bold text-xs">f</button>
                                    <button title="Google Photos" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm">
                                        <div className="w-4 h-4 rounded-full border-4 border-blue-500 border-t-red-500 border-r-yellow-400 border-b-green-500 rotate-45" />
                                    </button>
                                    <button title="More options" className="w-8 h-8 rounded-full bg-[#1a1a22] border border-zinc-700 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer text-zinc-400 hover:text-white">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>

                                {/* Background Remover Ad */}
                                <div onClick={handleRemoveBackgroundEditor} className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-colors group">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Scissors size={14} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-emerald-400">Instantly remove backgrounds</p>
                                        <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">Select an image and use our Background Remover. <span className="text-white group-hover:underline">Try it now</span></p>
                                    </div>
                                </div>

                                {/* Uploaded Grid */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 min-h-[300px]">
                                    {uploadedFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
                                            <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                                <ImagePlus size={24} className="text-zinc-500" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-300 mb-1">Your uploads will appear here</p>
                                            <p className="text-[10px] text-zinc-500 mx-auto max-w-[200px]">Upload images, videos or audio to use them in your designs.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {uploadedFiles.map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => addStockPhoto(url)}
                                                    className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-[#8b3dff] group relative"
                                                >
                                                    <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover group-hover:scale-105 opacity-90 group-hover:opacity-100 transition-all duration-300" loading="lazy" />
                                                    <div className="absolute top-2 right-2 p-1 bg-black/60 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal size={12} className="text-white" />
                                                    </div>
                                                </button>
                                            ))}
                                            {stockPhotos.map((url, i) => (
                                                <button
                                                    key={`stock-${i}`}
                                                    onClick={() => addStockPhoto(url)}
                                                    className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-[#8b3dff] group relative"
                                                >
                                                    <img src={url} alt={`Stock ${i}`} className="w-full h-full object-cover group-hover:scale-105 opacity-90 group-hover:opacity-100 transition-all duration-300" loading="lazy" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BRAND KIT */}
                        {activeTab === 'brand' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 relative h-full flex flex-col">
                                {!activeBrandCategory ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-4 px-1 mt-4">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center p-[1px]">
                                                <div className="w-full h-full bg-[#121216] rounded-[7px] flex items-center justify-center">
                                                    <Palette size={16} className="text-yellow-500" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-white text-sm">Brand Hub</h3>
                                        </div>

                                        <div className="space-y-1 overflow-y-auto pb-20 pr-1 custom-scrollbar">
                                            {brandCategories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveBrandCategory(cat.id)}
                                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-800/80 text-sm font-semibold text-zinc-300 hover:text-white transition-colors flex justify-between items-center group"
                                                >
                                                    {cat.label}
                                                    <ChevronDown size={14} className="text-zinc-600 group-hover:text-zinc-400 -rotate-90 transition-transform" />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 mt-4">
                                        <button
                                            onClick={() => setActiveBrandCategory(null)}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white mb-4 transition-colors"
                                        >
                                            <ArrowLeft size={14} /> Back to Brand Hub
                                        </button>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-white capitalize">{brandCategories.find(c => c.id === activeBrandCategory)?.label}</h4>
                                        </div>

                                        <div className="overflow-y-auto pb-20 pr-1 custom-scrollbar -mx-1 px-1">
                                            {activeBrandCategory === 'colours' && (
                                                <div className="grid grid-cols-5 gap-2">
                                                    {brandMockData.colours.map((color, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                const obj = fabricCanvasRef.current?.getActiveObject();
                                                                if (obj && (obj.type === 'i-text' || obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'polygon' || obj.type === 'path')) {
                                                                    obj.set('fill', color);
                                                                    fabricCanvasRef.current?.renderAll();
                                                                    pushHistory();
                                                                } else {
                                                                    applySmartBackground(color, false);
                                                                }
                                                            }}
                                                            style={{ backgroundColor: color }}
                                                            className="aspect-square rounded-full border border-zinc-700 hover:scale-110 transition-transform shadow-sm flex items-center justify-center opacity-90 hover:opacity-100 group"
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'logos' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {brandMockData.logos.map((url, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addSvgGraphic(url)}
                                                            className="aspect-video bg-[#1a1a22] rounded-xl border border-zinc-800 hover:border-indigo-500/50 flex items-center justify-center p-2 group transition-all"
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Logo ${i + 1}`}
                                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'photos' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {brandMockData.photos.map((url, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addStockPhoto(url)}
                                                            className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500 group relative"
                                                        >
                                                            <img src={url} alt={`Photo ${i}`} className="w-full h-full object-cover group-hover:scale-110 opacity-80 group-hover:opacity-100 transition-all duration-300" loading="lazy" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'templates' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {brandMockData.templates.map((url, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addStockPhoto(url)}
                                                            className="relative aspect-[3/4] bg-[#1e1e26] rounded-xl overflow-hidden group border border-zinc-800 hover:border-indigo-500 transition-all shadow-sm"
                                                        >
                                                            <img src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Template" loading="lazy" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'fonts' && (
                                                <div className="flex flex-col gap-2">
                                                    {brandMockData.fonts.map((f, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                const t = new (fabric as any).IText(f.label, { left: (canvasWidth || 1080) / 2 - 100, top: (canvasHeight || 1080) / 2, fontSize: 32, fontFamily: f.family, fontWeight: f.weight, fill: '#000' });
                                                                addObj(t);
                                                            }}
                                                            className="w-full py-3 px-4 bg-[#1a1a22] border border-zinc-800 hover:border-indigo-500 rounded-xl text-left transition-all group overflow-hidden relative"
                                                        >
                                                            <span className="text-xs font-bold text-zinc-500 block mb-1 uppercase tracking-wider">{f.label}</span>
                                                            <span className="text-xl text-white block group-hover:scale-[1.02] transition-transform origin-left" style={{ fontFamily: f.family, fontWeight: f.weight }}>The quick brown fox</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'icons' && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {brandMockData.icons.map((svgStr, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addSvgGraphicString(svgStr)}
                                                            className="aspect-square bg-[#1a1a22] border border-zinc-800 hover:border-indigo-500 rounded-xl flex items-center justify-center group transition-colors text-white hover:text-indigo-400"
                                                            dangerouslySetInnerHTML={{ __html: svgStr.replace('<svg', '<svg class="w-6 h-6 transform group-hover:scale-110 transition-transform"') }}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'graphics' && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {brandMockData.graphics.map((svgStr, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addSvgGraphicString(svgStr)}
                                                            className="aspect-square bg-[#1a1a22] border border-zinc-800 hover:border-indigo-500 rounded-xl flex items-center justify-center p-2 group transition-all"
                                                            dangerouslySetInnerHTML={{ __html: svgStr.replace('<svg', '<svg class="w-full h-full transform group-hover:scale-110 transition-transform"') }}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'charts' && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {brandMockData.charts.map((svgStr, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addSvgGraphicString(svgStr)}
                                                            className="aspect-square bg-white border border-zinc-800 hover:border-indigo-500 rounded-xl flex items-center justify-center p-2 group transition-all"
                                                            dangerouslySetInnerHTML={{ __html: svgStr.replace('<svg', '<svg class="w-full h-full transform group-hover:scale-110 transition-transform"') }}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {activeBrandCategory === 'components' && (
                                                <div className="flex flex-col gap-2">
                                                    {brandMockData.components.map((c, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                const rect = new (fabric as any).Rect({ width: 120, height: 40, fill: c.color, rx: 8, originX: 'center', originY: 'center' });
                                                                const text = new (fabric as any).IText(c.label, { fontSize: 16, fontFamily: 'Inter', fill: '#ffffff', fontWeight: 'bold', originX: 'center', originY: 'center' });
                                                                const group = new (fabric as any).Group([rect, text], { left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' });
                                                                addObj(group);
                                                            }}
                                                            className="w-full py-3 px-4 bg-[#1a1a22] border border-zinc-800 hover:border-indigo-500 rounded-xl transition-all flex items-center gap-3 relative overflow-hidden"
                                                        >
                                                            <div className="w-full flex items-center gap-3 pointer-events-none">
                                                                <div className="w-16 h-8 rounded shrink-0 flex items-center justify-center" style={{ backgroundColor: c.color }}>
                                                                    <span className="text-[10px] font-bold text-white uppercase">{c.label}</span>
                                                                </div>
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <div className="w-24 h-1.5 bg-zinc-700 rounded-full" />
                                                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Fallback for others */}
                                            {['all', 'guidelines', 'voice'].includes(activeBrandCategory) && (
                                                <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-white/[0.02] mt-4">
                                                    <Sparkles size={24} className="mx-auto text-indigo-400 mb-2 opacity-50" />
                                                    <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Use the brand hub to keep everything on-brand. Click other categories to see richer mock data in action.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PRO TOOLS (Vertical Floating Toolbar + Flyouts) */}
                        {activeTab === 'tools' && (
                            <div className="relative h-full flex flex-row animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Vertical Toolbar */}
                                <div className="w-16 bg-[#1a1a22] border-r border-zinc-800 flex flex-col items-center py-4 gap-4 overflow-y-auto custom-scrollbar shadow-none z-20">
                                    <button onClick={() => { setActiveToolFlyout(null); if (fabricCanvasRef.current) fabricCanvasRef.current.isDrawingMode = false; }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!activeToolFlyout ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Pointer / Select Tool">
                                        <MousePointer2 size={18} />
                                    </button>
                                    <button onClick={() => setActiveToolFlyout('draw')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeToolFlyout === 'draw' ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Draw / Sketch Tool">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[18px] h-[18px] ${activeToolFlyout === 'draw' ? 'text-white' : 'text-red-400'}`}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                    <button onClick={() => setActiveToolFlyout('shapes')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeToolFlyout === 'shapes' ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Shapes Tool">
                                        <div className="relative w-[18px] h-[18px]"><Square size={14} className="absolute top-0 left-0 fill-zinc-900" /><CircleIcon size={14} className="absolute bottom-0 right-0 fill-zinc-900" /></div>
                                    </button>
                                    <button onClick={() => setActiveToolFlyout('line')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeToolFlyout === 'line' ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Line Tool">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[18px] h-[18px] ${activeToolFlyout === 'line' ? 'text-white' : 'text-blue-400'}`}><line x1="5" y1="19" x2="19" y2="5"></line></svg>
                                    </button>
                                    <button onClick={() => setActiveToolFlyout('sticky')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeToolFlyout === 'sticky' ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Sticky Note Tool">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[18px] h-[18px] ${activeToolFlyout === 'sticky' ? 'text-white' : 'text-yellow-400'}`}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </button>
                                    <button onClick={() => { setActiveToolFlyout(null); const t = new (fabric as any).IText('Heading', { left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, fontSize: 64, fill: '#000', fontFamily: 'Inter', fontWeight: 'bold', originX: 'center', originY: 'center' }); addObj(t); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition-all shadow-sm" title="Text Tool">
                                        <Type size={18} className="text-purple-400" />
                                    </button>
                                    <button onClick={() => setActiveToolFlyout('signature')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeToolFlyout === 'signature' ? 'bg-[#8b3dff] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'}`} title="Signature Tool">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M22 13c-4.5-9-15.5-9-20 0"></path><path d="M2 11c4.5-9 15.5-9 20 0"></path></svg>
                                    </button>
                                    <button onClick={() => { setActiveToolFlyout(null); const w = 300, h = 150; const r1 = new (fabric as any).Rect({ width: w, height: h, fill: 'transparent', stroke: '#ccc', strokeWidth: 2, originX: 'center', originY: 'center' }); const l1 = new (fabric as any).Line([-w / 2, 0, w / 2, 0], { stroke: '#ccc', strokeWidth: 2, originX: 'center', originY: 'center' }); const l2 = new (fabric as any).Line([0, -h / 2, 0, h / 2], { stroke: '#ccc', strokeWidth: 2, originX: 'center', originY: 'center' }); const group = new (fabric as any).Group([r1, l1, l2], { left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' }); addObj(group); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition-all shadow-sm" title="Table Tool">
                                        <Grid3X3 size={18} />
                                    </button>
                                </div>

                                {/* Flyout Panel */}
                                {activeToolFlyout && (
                                    <div className="absolute left-[70px] top-4 w-60 bg-[#262633] rounded-2xl border border-zinc-700 shadow-2xl p-4 animate-in fade-in slide-in-from-left-4 z-10 max-h-[80%] overflow-y-auto">
                                        {/* DRAW FLYOUT */}
                                        {activeToolFlyout === 'draw' && (
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-white mb-2">Drawing Tools</h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <button onClick={() => { if (fabricCanvasRef.current) { fabricCanvasRef.current.isDrawingMode = true; fabricCanvasRef.current.freeDrawingBrush = new (fabric as any).PencilBrush(fabricCanvasRef.current); fabricCanvasRef.current.freeDrawingBrush.color = '#ff0000'; fabricCanvasRef.current.freeDrawingBrush.width = 2; } }} className="aspect-square bg-[#1a1a22] border border-zinc-700 hover:border-[#8b3dff] rounded-lg flex items-center justify-center group" title="Pen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                    <button onClick={() => { if (fabricCanvasRef.current) { fabricCanvasRef.current.isDrawingMode = true; fabricCanvasRef.current.freeDrawingBrush = new (fabric as any).PencilBrush(fabricCanvasRef.current); fabricCanvasRef.current.freeDrawingBrush.color = '#000000'; fabricCanvasRef.current.freeDrawingBrush.width = 8; } }} className="aspect-square bg-[#1a1a22] border border-zinc-700 hover:border-[#8b3dff] rounded-lg flex items-center justify-center group" title="Marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-5 h-5 text-zinc-300 group-hover:scale-110 transition-transform"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                    <button onClick={() => { if (fabricCanvasRef.current) { fabricCanvasRef.current.isDrawingMode = true; fabricCanvasRef.current.freeDrawingBrush = new (fabric as any).PencilBrush(fabricCanvasRef.current); fabricCanvasRef.current.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)'; fabricCanvasRef.current.freeDrawingBrush.width = 25; } }} className="aspect-square bg-[#1a1a22] border border-zinc-700 hover:border-[#8b3dff] rounded-lg flex items-center justify-center group" title="Highlighter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-yellow-500 bg-yellow-500 rounded px-0.5 group-hover:scale-110 transition-transform"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                    <button onClick={() => { if (fabricCanvasRef.current) { fabricCanvasRef.current.isDrawingMode = false; /* Implement custom Eraser by setting cursor to crosshair and listening for object clicks to remove if they are paths. For now, disable draw mode. */ } }} className="aspect-square bg-[#1a1a22] border border-zinc-700 hover:border-[#8b3dff] rounded-lg flex items-center justify-center group" title="Eraser"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform"><path d="M2.5 8.5h19m-19 0v-4h19v4m-19 0 3 14h13l3-14"></path></svg></button>
                                                </div>
                                                <div className="mt-4">
                                                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase tracking-wide">Thickness</label>
                                                    <input type="range" min="1" max="50" defaultValue="4" className="w-full accent-[#8b3dff]" onChange={(e) => { if (fabricCanvasRef.current && fabricCanvasRef.current.isDrawingMode) fabricCanvasRef.current.freeDrawingBrush.width = parseInt(e.target.value); }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* SHAPES FLYOUT */}
                                        {activeToolFlyout === 'shapes' && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-white mb-2">Shapes</h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { type: 'rect', icon: <Square size={16} /> },
                                                        { type: 'square', icon: <Square size={16} fill="currentColor" /> },
                                                        { type: 'circle', icon: <CircleIcon size={16} /> },
                                                        { type: 'triangle', icon: <TriangleIcon size={16} /> },
                                                        { type: 'inverted-triangle', icon: <TriangleIcon size={16} className="rotate-180" /> },
                                                        { type: 'star', icon: <Star size={16} /> },
                                                        { type: 'pentagon', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="12 2 22 8.5 18.2 22 5.8 22 2 8.5" /></svg> },
                                                        { type: 'hexagon', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7" /></svg> },
                                                    ].map((s, i) => (
                                                        <button key={i} onClick={() => {
                                                            let obj;
                                                            if (s.type === 'rect') obj = new (fabric as any).Rect({ width: 200, height: 100, fill: '#6366f1' });
                                                            else if (s.type === 'square') obj = new (fabric as any).Rect({ width: 150, height: 150, fill: '#ec4899' });
                                                            else if (s.type === 'circle') obj = new (fabric as any).Circle({ radius: 75, fill: '#10b981' });
                                                            else if (s.type === 'triangle') obj = new (fabric as any).Triangle({ width: 150, height: 150, fill: '#f59e0b' });
                                                            else if (s.type === 'inverted-triangle') obj = new (fabric as any).Triangle({ width: 150, height: 150, fill: '#a855f7', angle: 180 });
                                                            else if (s.type === 'star') obj = new (fabric as any).Polygon([{ x: 100, y: 10 }, { x: 40, y: 198 }, { x: 190, y: 78 }, { x: 10, y: 78 }, { x: 160, y: 198 }], { fill: '#ef4444' });
                                                            else if (s.type === 'pentagon') obj = new (fabric as any).Polygon([{ x: 50, y: 5 }, { x: 95, y: 35 }, { x: 80, y: 95 }, { x: 20, y: 95 }, { x: 5, y: 35 }], { fill: '#3b82f6', scaleX: 1.5, scaleY: 1.5 });
                                                            else if (s.type === 'hexagon') obj = new (fabric as any).Polygon([{ x: 25, y: 5 }, { x: 75, y: 5 }, { x: 100, y: 50 }, { x: 75, y: 95 }, { x: 25, y: 95 }, { x: 0, y: 50 }], { fill: '#14b8a6', scaleX: 1.5, scaleY: 1.5 });

                                                            if (obj) { obj.set({ left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' }); addObj(obj); setActiveToolFlyout(null); }
                                                        }} className="aspect-square bg-[#1a1a22] border border-zinc-700 hover:border-white rounded text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                            {s.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* LINE FLYOUT */}
                                        {activeToolFlyout === 'line' && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-white mb-2">Lines</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => { addObj(new (fabric as any).Line([-100, 0, 100, 0], { stroke: '#000', strokeWidth: 8, left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' })); setActiveToolFlyout(null); }} className="p-3 bg-[#1a1a22] border border-zinc-700 hover:border-white rounded flex items-center justify-center group" title="Straight Line">
                                                        <Minus size={24} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                    <button onClick={() => { addObj(new (fabric as any).Path('M -100 0 Q 0 -50 100 0', { fill: '', stroke: '#000', strokeWidth: 8, left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' })); setActiveToolFlyout(null); }} className="p-3 bg-[#1a1a22] border border-zinc-700 hover:border-white rounded flex items-center justify-center group" title="Curved Line">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 group-hover:scale-110 transition-transform"><path d="M4 14c4-7.33 10-7.33 14 0" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STICKY NOTE FLYOUT */}
                                        {activeToolFlyout === 'sticky' && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-white mb-2">Sticky Notes</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['#fef3c7', '#ffedd5', '#fce7f3', '#dbeafe', '#d1fae5', '#e0e7ff'].map((color, i) => (
                                                        <button key={i} onClick={() => {
                                                            const rect = new (fabric as any).Rect({ width: 200, height: 200, fill: color, rx: 8, originX: 'center', originY: 'center', shadow: new (fabric as any).Shadow({ color: 'rgba(0,0,0,0.2)', blur: 15, offsetX: 0, offsetY: 10 }) });
                                                            const text = new (fabric as any).IText('Idea', { fontSize: 24, fill: '#374151', fontFamily: 'Inter', originX: 'center', originY: 'center' });
                                                            const group = new (fabric as any).Group([rect, text], { left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' });
                                                            addObj(group);
                                                            setActiveToolFlyout(null);
                                                        }} className="aspect-square rounded shadow-sm hover:scale-110 transition-transform flex items-center justify-center border border-black/5" style={{ backgroundColor: color }}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SIGNATURE FLYOUT */}
                                        {activeToolFlyout === 'signature' && (
                                            <div className="space-y-4 w-60">
                                                <h4 className="text-xs font-bold text-white mb-2">Create Signature</h4>

                                                {/* Tabs */}
                                                <div className="flex bg-[#1a1a22] rounded-lg p-1">
                                                    <button onClick={() => setSignatureTab('text')} className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${signatureTab === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Text</button>
                                                    <button onClick={() => setSignatureTab('draw')} className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${signatureTab === 'draw' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Draw</button>
                                                    <button onClick={() => setSignatureTab('upload')} className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${signatureTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Upload</button>
                                                </div>

                                                {/* Content block based on active tab */}
                                                {signatureTab === 'text' && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Name</label>
                                                            <input type="text" value={signatureText} onChange={(e) => setSignatureText(e.target.value)} className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg p-2 text-xs text-white outline-none focus:border-[#8b3dff]" placeholder="Type your name..." />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Font Family</label>
                                                            <div className="relative">
                                                                <select value={signatureFont} onChange={(e) => setSignatureFont(e.target.value)} className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg p-2 text-xs text-white outline-none focus:border-[#8b3dff] appearance-none">
                                                                    <option value="Caveat">Caveat</option>
                                                                    <option value="Pacifico">Pacifico</option>
                                                                    <option value="Dancing Script">Dancing Script</option>
                                                                    <option value="Inter">Inter</option>
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2 top-2 text-zinc-500 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Color</label>
                                                            <div className="flex gap-2">
                                                                {['#ffffff', '#000000', '#2563eb', '#dc2626', '#16a34a'].map(c => (
                                                                    <button key={c} onClick={() => setSignatureColor(c)} className={`w-6 h-6 rounded-full border-2 ${signatureColor === c ? 'border-[#8b3dff]' : 'border-zinc-700'}`} style={{ backgroundColor: c }}></button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => {
                                                            const t = new (fabric as any).IText(signatureText || 'Signature', { left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, fontSize: 64, fill: signatureColor, fontFamily: signatureFont, fontStyle: 'italic', originX: 'center', originY: 'center' });
                                                            addObj(t);
                                                            setActiveToolFlyout(null);
                                                        }} className="w-full bg-[#8b3dff] hover:bg-[#7b32e6] text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-2">
                                                            Add signature
                                                        </button>
                                                    </div>
                                                )}

                                                {signatureTab === 'draw' && (
                                                    <div className="space-y-3">
                                                        <div className="w-full h-32 bg-white rounded-lg border border-zinc-700 relative overflow-hidden flex items-center justify-center">
                                                            <span className="text-zinc-300 text-xs font-medium">Draw here...</span>
                                                            <div className="absolute inset-0 z-10 cursor-crosshair" onPointerDown={() => console.log('Drawing initialized for signature')} />
                                                        </div>
                                                        <button onClick={() => {
                                                            const path = new (fabric as any).Path('M 0 50 Q 20 40 40 30 T 80 40 T 120 50 T 160 20', { fill: '', stroke: '#000', strokeWidth: 3, left: (canvasWidth || 1080) / 2, top: (canvasHeight || 1080) / 2, originX: 'center', originY: 'center' });
                                                            addObj(path);
                                                            setActiveToolFlyout(null);
                                                        }} className="w-full bg-[#8b3dff] hover:bg-[#7b32e6] text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-2">
                                                            Add signature
                                                        </button>
                                                    </div>
                                                )}

                                                {signatureTab === 'upload' && (
                                                    <div className="space-y-3">
                                                        <div className="w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-[#8b3dff] transition-all cursor-pointer bg-[#1a1a22]">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                            <span className="text-xs font-bold">Upload image</span>
                                                        </div>
                                                        <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-2 opacity-50 cursor-not-allowed">
                                                            Add signature
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PROJECTS */}
                        {activeTab === 'projects' && (
                            <div className="h-full flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Top Navigation & Filter Tabs */}
                                <div className="p-4 border-b border-zinc-800 space-y-4 shrink-0">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input type="text" placeholder="Search your content" className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#8b3dff] transition-colors" />
                                    </div>
                                    <div className="flex bg-[#1a1a22] rounded-lg p-1">
                                        {(['all', 'designs', 'folders'] as const).map(tab => (
                                            <button key={tab} onClick={() => { setActiveProjectsFilter(tab); setActiveFolder(null); }} className={`flex-1 text-[11px] py-1.5 rounded-md font-bold capitalize transition-all ${activeProjectsFilter === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
                                    {activeFolder ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setActiveFolder(null)}>
                                                <button className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                                                    <ArrowLeft size={16} />
                                                </button>
                                                <h4 className="text-sm font-bold text-white truncate">{activeFolder === 'Starred' ? 'Starred' : (savedFolders.find(f => f.id === activeFolder)?.name || 'Folder')}</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <button onClick={() => {
                                                    if (fabricCanvasRef.current) {
                                                        fabricCanvasRef.current.clear();
                                                    }
                                                    setActiveProjectId(null);
                                                }} className="bg-[#8b3dff] hover:bg-[#7b32e6] text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm group">
                                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Plus size={16} />
                                                    </div>
                                                    <span className="text-xs font-bold">Add design</span>
                                                </button>
                                                <button onClick={() => folderUploadInputRef.current?.click()} className="bg-[#1a1a22] border border-zinc-700 hover:border-zinc-500 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group">
                                                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                    </div>
                                                    <span className="text-xs font-bold">Upload</span>
                                                </button>
                                                <input type="file" className="hidden" ref={folderUploadInputRef} onChange={handleFolderImageUpload} accept="image/*" />
                                            </div>

                                            {(() => {
                                                const folderProjects = savedProjects.filter(p => p.folderId === activeFolder);
                                                return folderProjects.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {folderProjects.map((proj, i) => (
                                                            <div key={proj.id || i} className="group cursor-pointer relative" onClick={() => loadProject(proj)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(proj.id); }}>
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuId(activeMenuId === proj.id ? null : proj.id);
                                                                }} className="absolute top-2 right-2 z-20 bg-black/60 p-1.5 rounded text-zinc-400 hover:text-white hover:bg-black transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 shadow-lg border border-zinc-700/0 hover:border-zinc-500/50">
                                                                    <MoreHorizontal size={14} />
                                                                </button>
                                                                {activeMenuId === proj.id && (
                                                                    <div className="absolute top-8 right-2 z-50 w-36 bg-[#1a1a22] border border-zinc-700 rounded-xl shadow-xl flex flex-col py-1 animate-in zoom-in-95 origin-top-right" onClick={(e) => e.stopPropagation()}>
                                                                        <button className="px-3 py-2 text-xs text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"><CopyPlus size={12} /> Make a copy</button>
                                                                        <button onClick={() => {
                                                                            setSavedProjects(prev => {
                                                                                const up = prev.filter(p => p.id !== proj.id);
                                                                                try { localStorage.setItem('canva_clone_projects', JSON.stringify(up)); } catch (e) { }
                                                                                return up;
                                                                            });
                                                                            setActiveMenuId(null);
                                                                        }} className="px-3 py-2 text-xs text-left text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-zinc-800"><Trash2 size={12} /> Move to Trash</button>
                                                                    </div>
                                                                )}
                                                                <div className="aspect-[4/3] bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-[#8b3dff] overflow-hidden relative transition-colors shadow-sm">
                                                                    {proj.thumbnail ? (
                                                                        <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700"><LayersIcon size={24} /></div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                                                        <span className="bg-[#8b3dff] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">Edit</span>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-left">
                                                                    <p className="text-[11px] text-white font-bold truncate">{proj.name}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600 mb-2 w-6 h-6"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                        <p className="text-xs text-zinc-500 font-medium">This folder is empty.</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="space-y-6" onClick={() => setActiveMenuId(null)}>
                                            {/* FOLDERS GRID */}
                                            {['all', 'folders'].includes(activeProjectsFilter) && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Folders</h4>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button onClick={() => setActiveFolder('Starred')} className="bg-[#1a1a22] border border-zinc-800 hover:border-zinc-500 p-3 rounded-xl flex items-center gap-3 transition-colors text-left group">
                                                            <div className="w-8 h-8 bg-yellow-500/10 text-yellow-500 rounded-lg flex items-center justify-center shrink-0"><Star size={14} className="fill-yellow-500/20 group-hover:scale-110 transition-transform" /></div>
                                                            <span className="text-xs font-bold text-zinc-300 truncate">Starred</span>
                                                        </button>
                                                        {savedFolders.map(f => (
                                                            <div key={f.id} className="relative group cursor-pointer" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(f.id); }}>
                                                                <button onClick={() => setActiveFolder(f.id)} className="w-full bg-[#1a1a22] border border-zinc-800 hover:border-zinc-500 p-3 rounded-xl flex items-center gap-3 transition-colors text-left group">
                                                                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                                                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M10.4 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12l-1.6-2z" /></svg>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-zinc-300 truncate tracking-wide">{f.name}</span>
                                                                </button>
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuId(activeMenuId === f.id ? null : f.id);
                                                                }} className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10">
                                                                    <MoreHorizontal size={14} />
                                                                </button>
                                                                {activeMenuId === f.id && (
                                                                    <div className="absolute top-10 right-2 w-36 bg-[#1a1a22] border border-zinc-700 rounded-xl shadow-xl flex flex-col py-1 z-50 animate-in zoom-in-95 origin-top-right" onClick={(e) => e.stopPropagation()}>
                                                                        <button className="px-3 py-2 text-xs text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"><Star size={12} /> Star Folder</button>
                                                                        <button className="px-3 py-2 text-xs text-left text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 border-b border-zinc-800"><CopyPlus size={12} /> Share</button>
                                                                        <button onClick={() => {
                                                                            setSavedFolders(prev => {
                                                                                const up = prev.filter(x => x.id !== f.id);
                                                                                try { localStorage.setItem('canva_clone_folders', JSON.stringify(up)); } catch (e) { }
                                                                                return up;
                                                                            });
                                                                            setActiveMenuId(null);
                                                                        }} className="px-3 py-2 text-xs text-left text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button onClick={() => {
                                                            setCreateFolderName('Untitled folder');
                                                            setIsCreateFolderModalOpen(true);
                                                        }} className="bg-[#1e1e26] border border-dashed border-zinc-700 hover:border-[#8b3dff] p-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-left group">
                                                            <Plus size={14} className="text-zinc-500 group-hover:text-[#8b3dff] transition-colors" />
                                                            <span className="text-xs font-bold text-zinc-500 group-hover:text-[#8b3dff] transition-colors">Create folder</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* DESIGNS GRID */}
                                            {['all', 'designs'].includes(activeProjectsFilter) && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Designs</h4>
                                                    </div>

                                                    {(() => {
                                                        const rootProjects = savedProjects.filter(p => !p.folderId);
                                                        return rootProjects.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {rootProjects.map((proj, i) => (
                                                                    <div key={proj.id || i} className="group cursor-pointer relative" onClick={() => loadProject(proj)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(proj.id); }}>
                                                                        <button onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveMenuId(activeMenuId === proj.id ? null : proj.id);
                                                                        }} className="absolute top-2 right-2 z-20 bg-black/60 p-1.5 rounded text-zinc-400 hover:text-white hover:bg-black transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 shadow-lg border border-zinc-700/0 hover:border-zinc-500/50">
                                                                            <MoreHorizontal size={14} />
                                                                        </button>
                                                                        {activeMenuId === proj.id && (
                                                                            <div className="absolute top-8 right-2 z-50 w-36 bg-[#1a1a22] border border-zinc-700 rounded-xl shadow-xl flex flex-col py-1 animate-in zoom-in-95 origin-top-right" onClick={(e) => e.stopPropagation()}>
                                                                                <button className="px-3 py-2 text-xs text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"><CopyPlus size={12} /> Make a copy</button>
                                                                                <button onClick={() => {
                                                                                    setSavedProjects(prev => {
                                                                                        const up = prev.filter(p => p.id !== proj.id);
                                                                                        try { localStorage.setItem('canva_clone_projects', JSON.stringify(up)); } catch (e) { }
                                                                                        return up;
                                                                                    });
                                                                                    setActiveMenuId(null);
                                                                                }} className="px-3 py-2 text-xs text-left text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-zinc-800"><Trash2 size={12} /> Move to Trash</button>
                                                                            </div>
                                                                        )}
                                                                        <div className="aspect-[4/3] bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-[#8b3dff] overflow-hidden relative transition-colors shadow-sm">
                                                                            {proj.thumbnail ? (
                                                                                <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-contain" />
                                                                            ) : (
                                                                                <div className="absolute inset-0 flex items-center justify-center text-zinc-700"><LayersIcon size={24} /></div>
                                                                            )}
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                                                                <span className="bg-[#8b3dff] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">Edit</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 text-left">
                                                                            <p className="text-[11px] text-white font-bold truncate">{proj.name}</p>
                                                                            <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{proj.updatedAt ? new Date(proj.updatedAt).toLocaleString() : 'Just now'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl bg-white/[0.01]">
                                                                <LayersIcon size={24} className="mx-auto text-zinc-600 mb-2 opacity-50" />
                                                                <p className="text-[11px] text-zinc-500 font-medium">No saved designs yet.</p>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BACKGROUND TAB */}
                        {activeTab === 'background' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-zinc-300">Solid Document Colors</h4>
                                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                                            {activeObject?.type === 'image' || activeObject?.type === 'FabricImage' ? 'Image Fill' : 'Canvas Fill'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {bgColorsList.map((color, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applySmartBackground(color, false)}
                                                style={{ backgroundColor: color }}
                                                className="w-full aspect-square rounded-md border border-zinc-700 hover:scale-[1.15] hover:border-white transition-all shadow-sm z-10"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-zinc-300 mb-3">Premium Textures</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {bgStockWallpapers.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applySmartBackground(url, true)}
                                                className="aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all relative group"
                                            >
                                                <img src={url} alt="wallpaper" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                                    <span className="text-[10px] font-bold text-white bg-indigo-600 px-3 py-1 rounded-full shadow-lg">Apply Back</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LAYERS */}
                        {activeTab === 'layers' && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
                                {layers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                        <LayersIcon size={32} className="text-zinc-600 mb-3" />
                                        <p className="text-xs font-bold text-zinc-400">No objects added yet</p>
                                    </div>
                                )}
                                {layers.map((obj, i) => (
                                    <div key={i}
                                        onClick={() => { const c = fabricCanvasRef.current; if (c) { c.setActiveObject(obj); c.renderAll(); syncState(); } }}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-medium group ${activeObject === obj ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300 shadow-sm' : 'bg-[#1e1e26] border-zinc-800 hover:border-zinc-600 text-zinc-300'}`}>
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                                                {obj.type === 'image' || obj.type === 'FabricImage' ? <ImageIcon size={10} /> : obj.type === 'i-text' ? <Type size={10} /> : <Square size={10} />}
                                            </div>
                                            <span className="truncate max-w-[120px]">{obj.name || obj.type || `Layer ${layers.length - i}`}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-900 px-1 py-0.5 rounded-lg border border-zinc-800 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }} className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                                                {obj.visible !== false ? <Eye size={12} /> : <EyeOff size={12} className="text-red-400" />}
                                            </button>
                                            <div className="w-px h-3 bg-zinc-700"></div>
                                            <button onClick={(e) => { e.stopPropagation(); const c = fabricCanvasRef.current; if (c && c.bringObjectForward) { c.bringObjectForward(obj); c.renderAll(); syncState(); } }} className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-colors"><ChevronUp size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); const c = fabricCanvasRef.current; if (c && c.sendObjectBackwards) { c.sendObjectBackwards(obj); c.renderAll(); syncState(); } }} className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-colors"><ChevronDown size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-14 bg-gradient-to-r from-[#171720] to-[#111118] border-b border-zinc-800/80 flex items-center justify-between px-4 shrink-0 z-50">
                        <div className="flex items-center gap-4">

                            {/* Home */}
                            <button onClick={() => router.push('/dashboard')}
                                className="flex items-center justify-center w-9 h-9 rounded bg-[#262633]/80 border border-white/5 hover:bg-indigo-600 hover:border-indigo-500 text-white transition-all shadow-sm relative z-[60] pointer-events-auto">
                                <Home size={16} />
                            </button>

                            <div className="h-5 w-px bg-zinc-800/80 mx-1" />

                            {/* Isolated Undo/Redo Engine */}
                            <div className="flex items-center bg-[#191922] border border-zinc-800/80 shadow-inner rounded-lg p-0.5 relative z-[60]">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); undo(); }} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-2 hover:bg-zinc-800/60 text-zinc-400 hover:text-white rounded-md transition-colors disabled:opacity-25 relative z-50 pointer-events-auto">
                                    <Undo2 size={15} />
                                </button>
                                <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); redo(); }} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-2 hover:bg-zinc-800/60 text-zinc-400 hover:text-white rounded-md transition-colors disabled:opacity-25 relative z-50 pointer-events-auto">
                                    <Redo2 size={15} />
                                </button>
                            </div>

                            <div className="h-5 w-px bg-zinc-800/80 mx-1" />

                            {/* Size Selector */}
                            <div className="flex items-center bg-transparent relative z-[60]">
                                <button
                                    onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                                    className="text-[13px] text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 font-medium pointer-events-auto border border-zinc-800/60 shadow-sm bg-[#1e1e26]/50"
                                >
                                    <span>{activePreset || 'Custom Size'} — {canvasWidth}x{canvasHeight}px</span>
                                    <ChevronDown size={14} className="text-zinc-500" />
                                </button>

                                {isSizeDropdownOpen && (
                                    <div className="absolute top-10 left-0 w-[260px] bg-[#1a1a22] border border-zinc-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-[70] animate-in zoom-in-95 duration-100 text-left">
                                        <div className="px-4 py-2 border-b border-zinc-800">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Canvas Size</p>
                                        </div>
                                        {[
                                            { label: 'Instagram Post', w: 1080, h: 1080, icon: <Square size={14} /> },
                                            { label: 'YouTube Thumb', w: 1280, h: 720, icon: <Monitor size={14} /> },
                                            { label: 'Mobile Story', w: 1080, h: 1920, icon: <Monitor size={14} /> },
                                            { label: 'A4 Document', w: 794, h: 1123, icon: <FileText size={14} /> },
                                            { label: 'Poster', w: 1587, h: 2245, icon: <Maximize size={14} /> },
                                            { label: 'Presentation', w: 1920, h: 1080, icon: <Monitor size={14} /> }
                                        ].map(s => (
                                            <button
                                                key={s.label}
                                                onClick={() => {
                                                    setActivePreset(s.label);
                                                    setCanvasWidth(s.w);
                                                    setCanvasHeight(s.h);
                                                    setIsSizeDropdownOpen(false);
                                                    if (fabricCanvasRef.current) {
                                                        fabricCanvasRef.current.setWidth(s.w);
                                                        fabricCanvasRef.current.setHeight(s.h);
                                                        fabricCanvasRef.current.renderAll();
                                                        setTimeout(() => pushHistory(), 100);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center justify-between text-sm text-zinc-200 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-indigo-400 opacity-70 group-hover:opacity-100">{s.icon}</span>
                                                    <span>{s.label}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-mono">{s.w}x{s.h}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="flex items-center gap-4 relative z-[60] pointer-events-auto pr-2">

                            {/* Save Button */}
                            {authUser && (
                                <button
                                    onClick={() => {
                                        setIsSaving(true);
                                        saveCurrentDesign();
                                        setTimeout(() => {
                                            setIsSaving(false);
                                            setToast({ message: 'Project saved successfully', type: 'success' });
                                        }, 400);
                                    }}
                                    className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-[13px] font-semibold px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                                    title="Save Project"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Cloud size={16} strokeWidth={2.5} />}
                                    Save
                                </button>
                            )}

                            <div className="h-5 w-px bg-zinc-800/80 mx-1" />

                            {/* Zoom Controls */}
                            <div className="flex items-center bg-transparent text-xs font-semibold text-zinc-300 pointer-events-auto">
                                <button onClick={() => setZoomRatio(Math.max(0.1, zoomRatio - 0.1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"><Minus size={14} /></button>
                                <span className="w-11 text-center font-bold tracking-wide">{Math.round(zoomRatio * 100)}%</span>
                                <button onClick={() => setZoomRatio(Math.min(5, zoomRatio + 0.1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"><Plus size={14} /></button>
                            </div>

                            <div className="h-5 w-px bg-zinc-800/80 mx-1" />

                            <div className="relative">
                                <button onClick={() => setExportOpen(v => !v)}
                                    className="bg-[#8b3dff] hover:bg-[#7b32e6] text-white text-sm font-semibold px-5 py-1.5 rounded flex items-center gap-2 transition-colors">
                                    <ArrowUpToLine size={16} /> Export
                                </button>
                                {exportOpen && (
                                    <div className="absolute top-10 right-0 w-56 bg-[#1a1a22] border border-zinc-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-50 animate-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2 border-b border-zinc-800">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Download</p>
                                        </div>
                                        <button onClick={exportPDF} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center gap-3 text-sm text-indigo-400 font-medium transition-colors"><FileText size={16} /><span>PDF Document</span></button>
                                        <button onClick={exportPNG} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center gap-3 text-sm text-zinc-200 transition-colors"><ImageIcon size={16} className="text-blue-400" /><span>PNG Image</span></button>
                                        <button onClick={exportSVG} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center gap-3 text-sm text-zinc-200 transition-colors"><FileImage size={16} className="text-pink-400" /><span>SVG Vector</span></button>
                                        <button onClick={exportJSON} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center gap-3 text-sm text-zinc-200 transition-colors"><FileJson size={16} className="text-emerald-400" /><span>JSON Template</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Top Context Toolbar */}
                    <div className="h-[52px] bg-[#1a1a22] border-b border-zinc-800/80 flex items-center px-4 gap-4 shrink-0 overflow-x-auto z-40 shadow-sm scrollbar-hide">
                        {!activeObject ? (
                            <div className="flex items-center text-zinc-400 text-xs font-medium tracking-wide gap-2 opacity-80 pl-2">
                                <Info size={14} className="text-indigo-400" />
                                <span>Select an element on the canvas to see its formatting tools here</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 h-full py-1.5 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-1.5 border-r border-zinc-700/50 pr-4">
                                    <button onClick={() => { copy(); paste(); }} className="px-3 py-1.5 bg-[#262633] hover:bg-zinc-700 rounded-md text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold" title="Duplicate">
                                        <CopyPlus size={14} /> Duplicate
                                    </button>
                                    <button onClick={deleteSelected} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {activeObject.type === 'i-text' && (
                                    <div className="flex items-center gap-3 border-r border-zinc-700/50 pr-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Color:</span>
                                            <div className="relative group rounded-md overflow-hidden ring-1 ring-zinc-700 hover:ring-indigo-500 transition-all cursor-pointer">
                                                <input type="color" value={typeof getProp('fill', '#000000') === 'string' ? getProp('fill', '#000000') : '#000000'} onChange={e => setProp('fill', e.target.value)} className="w-7 h-7 cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10" />
                                                <div className="w-7 h-7" style={{ backgroundColor: getProp('fill', '#ffffff') as string }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-[#262633] rounded-md p-1 border border-zinc-800">
                                            <button onClick={() => setProp('fontWeight', getProp('fontWeight', 'normal') === 'bold' ? 'normal' : 'bold')} className={`p-1.5 rounded ${getProp('fontWeight') === 'bold' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}><Bold size={15} /></button>
                                            <button onClick={() => setProp('fontStyle', getProp('fontStyle', 'normal') === 'italic' ? 'normal' : 'italic')} className={`p-1.5 rounded ${getProp('fontStyle') === 'italic' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}><Italic size={15} /></button>
                                        </div>

                                        <div className="flex items-center gap-2 bg-[#262633] px-3 py-1.5 rounded-md border border-zinc-800">
                                            <Minus onClick={() => setProp('fontSize', Math.max((getProp('fontSize', 24) as number) - 1, 8))} size={14} className="text-zinc-400 hover:text-white cursor-pointer" />
                                            <input type="number" value={getProp('fontSize', 24)} onChange={e => setProp('fontSize', parseInt(e.target.value))} className="w-9 bg-transparent text-xs font-semibold text-white text-center outline-none" min="8" max="250" />
                                            <Plus onClick={() => setProp('fontSize', Math.min((getProp('fontSize', 24) as number) + 1, 250))} size={14} className="text-zinc-400 hover:text-white cursor-pointer" />
                                        </div>
                                    </div>
                                )}

                                {(activeObject.type === 'image' || activeObject.type === 'FabricImage') && (
                                    <div className="flex items-center gap-3 border-r border-zinc-700/50 pr-4">
                                        <button onClick={() => { setIsCroppingEditor(true); startIndependentImageCrop(fabricCanvasRef.current); }} className="px-3 py-1.5 bg-[#262633] hover:bg-zinc-700 border border-zinc-700/50 rounded-md text-xs font-semibold flex items-center gap-1.5 text-zinc-300 hover:text-white transition-all"><Crop size={14} /> Crop Image</button>
                                        <button onClick={handleRemoveBackgroundEditor} disabled={isRemovingBgEditor} className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-50 rounded-md text-xs font-bold flex items-center gap-1.5 text-white shadow-md transition-all hover:shadow-indigo-500/20">
                                            {isRemovingBgEditor ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                            {isRemovingBgEditor ? 'Removing...' : 'Remove BG'}
                                        </button>
                                    </div>
                                )}

                                {activeObject.type !== 'i-text' && activeObject.type !== 'image' && activeObject.type !== 'FabricImage' && (
                                    <div className="flex items-center gap-2 border-r border-zinc-700/50 pr-4 pl-2">
                                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Fill:</span>
                                        <div className="relative group rounded overflow-hidden ring-1 ring-zinc-700 hover:ring-indigo-500 transition-all cursor-pointer">
                                            <input type="color" value={typeof getProp('fill', '#6366f1') === 'string' ? getProp('fill', '#6366f1') : '#6366f1'} onChange={e => setProp('fill', e.target.value)} className="w-8 h-8 cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10" />
                                            <div className="w-8 h-8" style={{ backgroundColor: getProp('fill', '#6366f1') as string }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 border-r border-zinc-700/50 pr-4">
                                    <div className="flex bg-[#262633] border border-zinc-800 rounded-md p-1">
                                        {[['left', <AlignLeft key="1" size={15} />], ['center-h', <AlignCenter key="2" size={15} />], ['right', <AlignRight key="3" size={15} />]].map(([d, icon]) => (
                                            <button key={d as string} onClick={() => alignObj(d as string)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{icon}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-[11px] pr-1 text-zinc-500 font-bold uppercase tracking-wider">Opacity:</span>
                                    <input type="range" min="0" max="1" step="0.05" value={getProp('opacity', 1)} onChange={e => setProp('opacity', parseFloat(e.target.value))} className="w-24 accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] font-mono text-zinc-400 w-6">{Math.round((getProp('opacity', 1) as number) * 100)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <main ref={wrapperRef} className="flex-1 bg-[#0e0e12] flex items-center justify-center overflow-hidden relative"
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY }); }}
                        onPointerDown={(e) => {
                            if (e.target === e.currentTarget) {
                                const c = fabricCanvasRef.current;
                                if (c) {
                                    c.discardActiveObject();
                                    c.renderAll();
                                    setInlineMenuPos(null);
                                }
                            }
                        }}
                        onClick={() => setContextMenu(null)}>

                        {/* A very subtle dotted background grid */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-40"
                            style={{ backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        {isCroppingEditor && (
                            <div className="absolute top-6 z-30 bg-[#14141b] border border-indigo-500/60 rounded-full px-5 py-2 flex items-center gap-3 shadow-[0_10px_40px_rgba(99,102,241,0.2)] animate-in fade-in slide-in-from-top-4">
                                <span className="text-xs font-semibold text-indigo-300">Drag/Resize Box to Crop:</span>
                                <button onClick={() => applyIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition">
                                    <Check size={14} /> Apply Crop
                                </button>
                                <button onClick={() => cancelIndependentCrop(fabricCanvasRef.current, () => setIsCroppingEditor(false))} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full text-xs font-medium flex items-center gap-1 transition">
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}

                        {inlineMenuPos && activeObject && !isCroppingEditor && (
                            <div className="absolute z-[100] bg-[#1a1a22] border border-zinc-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] rounded-lg py-1 px-1.5 flex items-center gap-1 zoom-in-95 animate-in pointer-events-auto"
                                style={{ left: inlineMenuPos.x, top: inlineMenuPos.y, transform: 'translate(-50%, -100%)' }}>
                                <button onClick={copy} className="p-1.5 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors" title="Copy"><Copy size={13} /></button>
                                <button onClick={() => { copy(); paste(); }} className="p-1.5 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors" title="Duplicate"><CopyPlus size={13} /></button>
                                <div className="w-px h-4 bg-zinc-700 mx-1.5"></div>
                                <button onClick={() => {
                                    const c = fabricCanvasRef.current;
                                    if (c && activeObject) {
                                        if (activeObject.lockMovementX) {
                                            activeObject.set({ lockMovementX: false, lockMovementY: false, lockRotation: false, lockScalingX: false, lockScalingY: false });
                                        } else {
                                            activeObject.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true });
                                        }
                                        c.renderAll();
                                        syncState();
                                    }
                                }} className="p-1.5 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors" title="Lock/Unlock">
                                    {activeObject.lockMovementX ? <Lock size={13} className="text-yellow-500" /> : <Unlock size={13} />}
                                </button>
                                <div className="w-px h-4 bg-zinc-700 mx-1.5"></div>
                                <button onClick={deleteSelected} className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors" title="Delete"><Trash2 size={13} /></button>
                                <button onClick={(e) => setContextMenu({ visible: true, x: e.clientX, y: e.clientY })} className="p-1.5 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors" title="More options"><MoreHorizontal size={13} /></button>
                            </div>
                        )}

                        <div className="bg-white relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] origin-center transition-transform"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const type = e.dataTransfer.getData('fabricType');
                                const url = e.dataTransfer.getData('fabricUrl');
                                const c = fabricCanvasRef.current;
                                if (!c) return;
                                const pointer = c.getPointer(e.nativeEvent);

                                if (type === 'rect') addObj(new (fabric as any).Rect({ left: pointer.x - 125, top: pointer.y - 125, width: 250, height: 250, fill: '#6366f1', rx: 12 }));
                                else if (type === 'circle') addObj(new (fabric as any).Circle({ left: pointer.x - 125, top: pointer.y - 125, radius: 125, fill: '#ec4899' }));
                                else if (type === 'triangle') addObj(new (fabric as any).Triangle({ left: pointer.x - 125, top: pointer.y - 125, width: 250, height: 250, fill: '#10b981' }));
                                else if (type === 'line') addObj(new (fabric as any).Line([pointer.x - 150, pointer.y, pointer.x + 150, pointer.y], { stroke: '#f59e0b', strokeWidth: 8 }));
                                else if (type === 'heading') addObj(new (fabric as any).IText('Heading Text', { left: pointer.x - 200, top: pointer.y - 50, fontSize: 84, fontFamily: 'Inter', fill: '#0f172a', fontWeight: 'bold' }));
                                else if (type === 'subheading') addObj(new (fabric as any).IText('Subheading', { left: pointer.x - 150, top: pointer.y - 25, fontSize: 48, fontFamily: 'Inter', fill: '#334155', fontWeight: 'bold' }));
                                else if (type === 'bodytext') addObj(new (fabric as any).IText('Body text here...', { left: pointer.x - 100, top: pointer.y - 15, fontSize: 28, fontFamily: 'Inter', fill: '#64748b' }));
                                else if (type === 'photo' && url) {
                                    (fabric as any).Image.fromURL(url).then((img: any) => {
                                        img.set({ left: pointer.x - 150, top: pointer.y - 150 });
                                        img.scaleToWidth(300);
                                        c.add(img);
                                        c.setActiveObject(img);
                                        c.renderAll();
                                        pushHistory();
                                    }).catch(() => { });
                                }
                            }}
                            style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoomRatio})` }}>
                            {Object.values(activeCursors).map((c: any) => (
                                <div key={c.socketId} className="absolute z-[99]" style={{ left: c.cursor.x * zoomRatio, top: c.cursor.y * zoomRatio, transition: 'all 0.1s ease-out', pointerEvents: 'none' }}>
                                    <MousePointer2 fill="#8b3dff" color="#8b3dff" size={18} className="-rotate-12 drop-shadow-md" />
                                    <div className="bg-[#8b3dff] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg translate-x-4 translate-y-1">{c.user?.name || 'Guest'}</div>
                                </div>
                            ))}
                            <canvas ref={canvasElRef} />
                        </div>

                        {/* Canva-Style Context Menu Overlay */}
                        {contextMenu && contextMenu.visible && (
                            <div
                                className="fixed bg-[#1a1a1f] border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[9999] text-sm text-zinc-300 font-medium py-1 animate-in zoom-in-95 duration-100"
                                style={{ top: contextMenu.y, left: contextMenu.x, width: 220 }}
                                onClick={(e) => e.stopPropagation()}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <button onClick={() => { copy(); setContextMenu(null); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Copy size={14} className="text-zinc-500 group-hover:text-white" /> Copy</div><span className="text-[10px] text-zinc-600 group-hover:text-white/60">Ctrl C</span>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Copy style activated!'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><FileText size={14} className="text-zinc-500 group-hover:text-white" /> Copy style</div><span className="text-[10px] text-zinc-600 group-hover:text-white/60">Ctrl Alt C</span>
                                </button>
                                <button onClick={() => { paste(); setContextMenu(null); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Monitor size={14} className="text-zinc-500 group-hover:text-white" /> Paste</div><span className="text-[10px] text-zinc-600 group-hover:text-white/60">Ctrl V</span>
                                </button>
                                <button onClick={() => { copy(); paste(); setContextMenu(null); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><CopyPlus size={14} className="text-zinc-500 group-hover:text-white" /> Duplicate</div><span className="text-[10px] text-zinc-600 group-hover:text-white/60">Ctrl D</span>
                                </button>
                                <button onClick={() => { deleteSelected(); setContextMenu(null); }} className="w-full text-left px-5 py-2.5 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Trash2 size={14} className="text-red-500/50 group-hover:text-red-400" /> Delete</div><span className="text-[10px] text-zinc-600 group-hover:text-white/60">Del</span>
                                </button>

                                <div className="h-px bg-zinc-800 my-1"></div>

                                <button onClick={() => { alignObj('center-h'); alignObj('center-v'); setContextMenu(null); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><AlignCenter size={14} className="text-zinc-500 group-hover:text-white" /> Align to page</div>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Resize Configuration opens canvas resizer window'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Frame size={14} className="text-zinc-500 group-hover:text-white" /> Resize canvas</div>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Background Locked.'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Lock size={14} className="text-zinc-500 group-hover:text-white" /> Lock</div>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Hyperlink editor active!'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><LinkIcon size={14} className="text-zinc-500 group-hover:text-white" /> Link</div>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Video/Animation timeline sequence panel triggered.'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Clock size={14} className="text-zinc-500 group-hover:text-white" /> Show element timings</div>
                                </button>
                                <button onClick={() => { setContextMenu(null); alert('Editing SVG Alternate Text'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3"><Type size={14} className="text-zinc-500 group-hover:text-white" /> Alternative text</div>
                                </button>

                                <div className="h-px bg-zinc-800 my-1"></div>

                                <button onClick={() => { setContextMenu(null); alert('File Info requested.'); }} className="w-full text-left px-5 py-2.5 hover:bg-violet-600 hover:text-white flex items-center gap-3 group transition-colors">
                                    <Info size={14} className="text-zinc-500 group-hover:text-white" /> Info
                                </button>
                            </div>
                        )}
                    </main>
                </div>

                {/* Top Toolbar Replaced Aside */}
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

            {/* CREATE FOLDER MODAL OVERLAY */}
            {isCreateFolderModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div
                        onKeyDown={(e) => e.stopPropagation()}
                        className="bg-[#14141B] border border-zinc-800 rounded-2xl w-[440px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-white tracking-wide">Create a folder</h3>
                            <button onClick={() => setIsCreateFolderModalOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-6">
                            <div>
                                <label className="text-[11px] font-bold text-zinc-400 block mb-2 px-0.5">Name</label>
                                <input
                                    type="text"
                                    value={createFolderName}
                                    onChange={(e) => setCreateFolderName(e.target.value)}
                                    className="w-full bg-[#0c0c0e] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-[#8b3dff] transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-zinc-400 block mb-2 px-0.5">People with access</label>
                                <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-3 flex flex-col gap-3">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input type="text" placeholder="Add emails or people" className="w-full bg-transparent text-xs text-white placeholder-zinc-500 pl-9 outline-none font-medium" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3 px-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-[11px] font-black shadow-md border border-white/10 shrink-0 uppercase">
                                        {authUser?.name ? authUser.name.substring(0, 2) : 'JD'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-bold text-white">{authUser?.name || 'John Doe (you)'}</p>
                                        <p className="text-[10px] text-zinc-400 font-medium">{authUser?.email || 'Owner'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-zinc-800/80 flex justify-end">
                            <button onClick={() => {
                                const nf = { id: `folder_${Date.now()}`, name: createFolderName || 'Untitled folder' };
                                setSavedFolders(prev => {
                                    const up = [...prev, nf];
                                    try { localStorage.setItem('canva_clone_folders', JSON.stringify(up)); } catch (e) { }
                                    return up;
                                });
                                setIsCreateFolderModalOpen(false);
                            }} className="bg-[#8b3dff] hover:bg-[#7b32e6] text-white text-[13px] font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
                                Create folder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}