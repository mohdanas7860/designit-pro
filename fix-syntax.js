const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const s1 = `                                    <span className="text-sm font-semibold text-gray-300">Custom Size<br /><span className="text-xs text-zinc-500 font-normal leading-tight">Freeform Layout</span></span>
                                </button>
                                </button>
                            </div>
                        )}`;
const r1 = `                                    <span className="text-sm font-semibold text-gray-300">Custom Size<br /><span className="text-xs text-zinc-500 font-normal leading-tight">Freeform Layout</span></span>
                                </button>
                            </div>
                        )}`;
c = c.replace(s1, r1);

const s2 = `                    </div>
                </div>
            </div>
            </div >
        );
    }`;
const r2 = `                    </div>
                </div>
            </div>
        </div>
        );
    }`;
c = c.replace(s2, r2);

const r3 = `<button onClick={() => changeSize(1200, 1200)} className="group flex flex-col items-center space-y-4 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 hover:border-zinc-600 transition-all shadow-md">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"><Plus size={28} /></div>
                                        <span className="text-sm font-semibold text-gray-300">Custom Size<br /><span className="text-xs text-zinc-500 font-normal leading-tight">Freeform Layout</span></span>
                                    </button>
                                </button>
                            </div>`;
c = c.replace(r3, r3.replace('</button>\n                                </button>', '</button>'));

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
