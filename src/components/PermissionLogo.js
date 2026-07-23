import React from 'react';
import Svg, { Defs, ClipPath, Rect, Path, Circle, G } from 'react-native-svg';

export default function PermissionLogo({ width = 534, height = 534, style }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 534 534"
      fill="none"
      style={style}
    >
      <Defs>
        {/* Clip path for Board rounding */}
        <ClipPath id="boardClip">
          <Rect x="107" y="60" width="320" height="400" rx="24" />
        </ClipPath>
      </Defs>

      {/* 1. Clipboard Board body with vertical split shading */}
      <G clipPath="url(#boardClip)">
        {/* Left half: Lighter grey */}
        <Rect x="107" y="60" width="320" height="400" fill="#BEC7CF" />
        {/* Right half overlay: Darker grey */}
        <Rect x="267" y="60" width="160" height="400" fill="#ABB3BA" />
      </G>

      {/* 2. Paper Sheet with vertical split shading and folded bottom-left corner */}
      {/* Paper main body path (minus folded corner) */}
      <Path
        d="M 187 440 L 397 440 L 397 90 L 137 90 L 137 390 Z"
        fill="#F3F5F9"
      />
      {/* Paper right-half overlay */}
      <Path
        d="M 267 440 L 397 440 L 397 90 L 267 90 Z"
        fill="#E1E6FO"
      />
      {/* Folded bottom-left triangle */}
      <Path
        d="M 137 390 L 187 390 L 187 440 Z"
        fill="#BEC7CF"
      />

      {/* 3. Clipboard Lines (Checklist horizontal bars) */}
      <G fill="#4D5E80">
        <Rect x="190" y="140" width="100" height="14" rx="7" />
        <Rect x="190" y="175" width="170" height="14" rx="7" />
        <Rect x="190" y="210" width="150" height="14" rx="7" />
        <Rect x="190" y="245" width="100" height="14" rx="7" />
        <Rect x="190" y="280" width="70" height="14" rx="7" />
        <Rect x="190" y="315" width="70" height="14" rx="7" />
        <Rect x="190" y="350" width="70" height="14" rx="7" />
      </G>

      {/* 4. Top Clip with vertical split shading */}
      {/* Left side clip */}
      <Path
        d="M 197 80 L 197 55 C 197 45 220 35 240 35 L 267 35 L 267 80 Z"
        fill="#59ABFF"
      />
      {/* Right side clip */}
      <Path
        d="M 337 80 L 337 55 C 337 45 314 35 294 35 L 267 35 L 267 80 Z"
        fill="#4A9BE5"
      />
      {/* Clip hole circle */}
      {/* Left half hole */}
      <Path
        d="M 267 58 A 8 8 0 0 1 267 42 L 267 58 Z"
        fill="#394B63"
      />
      {/* Right half hole */}
      <Path
        d="M 267 42 A 8 8 0 0 1 267 58 L 267 42 Z"
        fill="#2C3A4E"
      />

      {/* 5. Security Shield with vertical split shading & Checkmark */}
      {/* Outer shield rim */}
      {/* Left outer */}
      <Path
        d="M 350 270 C 310 270 270 290 270 300 L 270 370 C 270 420 310 455 350 470 L 350 270 Z"
        fill="#BEC7CF"
      />
      {/* Right outer */}
      <Path
        d="M 350 270 C 390 270 430 290 430 300 L 430 370 C 430 420 390 455 350 470 L 350 270 Z"
        fill="#ABB3BA"
      />

      {/* Inner shield color */}
      {/* Left inner */}
      <Path
        d="M 350 285 C 318 285 285 302 285 310 L 285 370 C 285 410 318 440 350 452 L 350 285 Z"
        fill="#59ABFF"
      />
      {/* Right inner */}
      <Path
        d="M 350 285 C 382 285 415 302 415 310 L 415 370 C 415 410 382 440 350 452 L 350 285 Z"
        fill="#4A9BE5"
      />

      {/* White checkmark inside the shield */}
      <Path
        d="M 315 370 L 340 395 L 385 340"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
