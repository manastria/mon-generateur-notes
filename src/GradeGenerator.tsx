"use client";

import React, { useState, useRef, useEffect } from 'react';

const GradeGenerator = () => {
  // On définit la marge de gauche dans une constante
  const LEFT_MARGIN = 30;
  
  const [grade, setGrade] = useState('15');
  const [maxGrade, setMaxGrade] = useState('20');
  const [gradeWidth, setGradeWidth] = useState(80);
  const [isMounted, setIsMounted] = useState(false);
  const [exportScale, setExportScale] = useState('1');
  const svgRef = useRef<SVGSVGElement>(null);
  const gradeTextRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayGrade = grade.toString().replace('.', ',');

  useEffect(() => {
    if (isMounted && gradeTextRef.current) {
      const bbox = gradeTextRef.current.getBBox();
      setGradeWidth(bbox.width);
    }
  }, [grade, isMounted]);

  const copyToClipboard = async () => {
    if (!svgRef.current) return;
  
    // Récupère le facteur d'échelle et le dpr
    const scale = parseFloat(exportScale);
    const dpr = (window.devicePixelRatio || 1) * 2;
  
    // 1. Récupérer la boîte englobante du SVG original
    const { x, y, width, height } = svgRef.current.getBBox();
  
    // Petite marge pour éviter de rogner le contenu
    const margin = 10;
    const finalWidth = width + margin;
    const finalHeight = height + margin;
  
    // 2. Cloner le SVG pour le recadrer
    const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
  
    // On définit le viewBox du clone pour correspondre au contenu :
    clonedSvg.setAttribute('viewBox', `${x - margin / 2} ${y - margin / 2} ${finalWidth} ${finalHeight}`);
  
    // (Optionnel) On peut fixer width/height en *SVG user units* si on veut,
    // mais souvent seul le viewBox suffit car on va dessiner via <canvas>.
    // clonedSvg.setAttribute('width', finalWidth);
    // clonedSvg.setAttribute('height', finalHeight);
  
    // 3. On sérialise le clone en "data" SVG
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(blob);
  
    // 4. Création du <canvas> à la bonne résolution
    //    => on multiplie par le scale et par le devicePixelRatio
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth * scale * dpr;
    canvas.height = finalHeight * scale * dpr;
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Permet un anti-aliasing de meilleure qualité
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  
    // IMPORTANT : on "scale" le contexte pour dessiner comme si le canvas
    // faisait (finalWidth * scale) en « unités CSS », mais en réalité on a
    // multiplié la taille physique par dpr.
    ctx.scale(dpr, dpr);
  
    const img = new Image();
    img.onload = async () => {
      // On dessine l'image en tenant compte uniquement du 'scale'
      // (puisque le dpr est géré par ctx.scale(dpr, dpr)).
      ctx.drawImage(
        img,
        0,
        0,
        finalWidth * scale,
        finalHeight * scale
      );
  
      // 5. Conversion en blob PNG
      try {
        const pngBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/png', 1.0)
        );
        const clipboardItem = new ClipboardItem({ 'image/png': pngBlob as Blob });
        await navigator.clipboard.write([clipboardItem]);
        alert('Image copiée dans le presse-papiers !');
      } catch (err) {
        if (err instanceof Error) {
          alert('Erreur lors de la copie : ' + err.message);
        } else {
          alert('Erreur lors de la copie');
        }
      }
  
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };
  

  const handleGradeChange = (value: string) => {
    const normalizedValue = value.replace(',', '.');
    if (normalizedValue === '' || (parseFloat(normalizedValue) >= 0 && parseFloat(normalizedValue) <= 20)) {
      setGrade(normalizedValue);
    }
  };

  const handleMaxGradeChange = (value: string) => {
    const normalizedValue = value.replace(',', '.');
    if (normalizedValue === '' || (parseFloat(normalizedValue) > 0)) {
      setMaxGrade(normalizedValue);
    }
  };

  const handleExportScaleChange = (value: string) => {
    if (parseFloat(value) > 0) {
      setExportScale(value);  
    }
  };

  if (!isMounted) {
    return null;
  }

  const rotationAngle = -7;
  // Au lieu d'utiliser directement 30, on utilise LEFT_MARGIN
  const gradeX = LEFT_MARGIN;
  const gradeY = 70;

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="border rounded-lg shadow-lg bg-white p-6">
        <h2 className="text-xl font-bold mb-4">Générateur de notes</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Note</label>
            <input
              type="text"
              value={displayGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-24 px-3 py-2 border rounded"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Note maximale</label>
            <input
              type="text"
              value={maxGrade}
              onChange={(e) => handleMaxGradeChange(e.target.value)}
              className="w-24 px-3 py-2 border rounded"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Échelle export</label>
            <input 
              type="number"
              min="0.1"
              step="0.1"
              value={exportScale}
              onChange={(e) => handleExportScaleChange(e.target.value)}
              className="w-24 px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 self-end"
          >
            Copier l&apos;image
          </button>
        </div>
        
        <div className="border rounded p-4 bg-white">
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 120"
            className="w-full h-auto"
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                <feOffset dx="1.5" dy="1.5"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <linearGradient id="gradeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#FF0000"}}/>
                <stop offset="50%" style={{stopColor:"#FF0000"}}/>
                <stop offset="100%" style={{stopColor:"#CC0000"}}/>
              </linearGradient>

              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor:"#FF0000"}}/>
                <stop offset="100%" style={{stopColor:"#CC0000"}}/>
              </linearGradient>
            </defs>

            <g transform={`rotate(${rotationAngle}, ${gradeX}, ${gradeY})`}>
              <text
                ref={gradeTextRef}
                x={gradeX}
                y={gradeY}
                fontFamily="Trebuchet MS, Arial"
                fontSize="65"
                fill="url(#gradeGradient)"
                filter="url(#shadow)"
                fontWeight="bold"
                style={{
                  paintOrder: "stroke",
                  stroke: "#FFFFFF",
                  strokeWidth: "2px",
                  strokeLinecap: "round",
                  strokeLinejoin: "round"
                }}
              >
                {displayGrade}
              </text>
            </g>
            
            <path
              d={`M ${gradeX} ${gradeY + 15} Q ${gradeX + gradeWidth/2} ${gradeY + 20}, ${gradeX + gradeWidth + 15} ${gradeY + 15}`}
              stroke="url(#lineGradient)"
              strokeWidth="3"
              transform={`rotate(${rotationAngle}, ${gradeX}, ${gradeY + 15})`}  
              filter="url(#shadow)"
              fill="none"
            />

            <text
              x={gradeX + gradeWidth/2 + 15}
              y="115"
              fontFamily="Trebuchet MS, Arial"
              fontSize="35"
              fill="#D40000"
              textAnchor="middle"
              filter="url(#shadow)"
              style={{
                paintOrder: "stroke",
                stroke: "#FFFFFF",
                strokeWidth: "1px",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }}
            >
              {maxGrade}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GradeGenerator;
