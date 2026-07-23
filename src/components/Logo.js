import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';

export default function Logo({ width = 401, height = 365.37, style }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 401 365.37"
      fill="none"
      style={style}
    >
      <Defs>
        {/* Mountain Gradient: Vibrant Green to Emerald/Forest Green */}
        <LinearGradient id="mountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3CD560" />
          <Stop offset="50%" stopColor="#29BD4F" />
          <Stop offset="100%" stopColor="#1C9237" />
        </LinearGradient>
        {/* Sun Gradient: Bright Yellow to Gold/Orange */}
        <LinearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFDE2F" />
          <Stop offset="100%" stopColor="#FFAA00" />
        </LinearGradient>
      </Defs>

      {/* Sun Group */}
      <G transform="translate(130, 80)">
        {/* Sun Center Circle */}
        <Circle cx="0" cy="0" r="25" fill="url(#sunGrad)" />
        {/* Sun Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
          <Path
            key={index}
            d="M -5 -35 L 5 -35 L 0 -47 Z"
            fill="url(#sunGrad)"
            transform={`rotate(${angle})`}
          />
        ))}
      </G>

      {/* Mountain Path (Merged Range with rounded peaks and bottom corners) */}
      <Path
        d="M 50 290 C 35 290 25 280 30 265 L 95 165 C 105 145 125 145 135 165 L 175 225 L 235 120 C 248 100 272 100 285 120 L 370 265 C 375 280 365 290 350 290 Z"
        fill="url(#mountainGrad)"
      />
    </Svg>
  );
}
