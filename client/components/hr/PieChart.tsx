import React, { useEffect, useState, useCallback } from 'react';
import { PieChart as RechartsPC, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { name: 'Unflagged', value: 790, color: '#86BC25' },
  { name: 'Flagged', value: 210, color: '#E11D48' }
];

const COLORS = ['#86BC25', '#E11D48'];

// Custom hook for responsive design
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};

// Add a simple debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export function HRPieChart() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSlice, setActiveSlice] = useState(null);
  const [hoverSlice, setHoverSlice] = useState(null);
  const { width } = useWindowSize();
  
  // Debounce the hover effect to prevent flickering
  const debouncedHoverSlice = useDebounce(hoverSlice, 50);
  
  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const renderColorfulLegendText = (value: string, entry: any) => {
    const color = entry.color;
    return <span style={{ color: color, fontWeight: 'bold' }}>{value}</span>;
  };

  const handleClick = (data, index) => {
    setActiveSlice(activeSlice === index ? null : index);
  };

  // Memoize the label renderer to prevent unnecessary re-renders
  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
    // Don't render labels on very small screens
    if (width < 380) return null;
    
    const RADIAN = Math.PI / 180;
    const isLargeScreen = width >= 768;
    
    // For large screens, position labels outside the chart
    if (isLargeScreen) {
      // Calculate position outside the pie
      const radius = outerRadius * 1.1;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
      // Create connecting line
      const lineX1 = cx + outerRadius * 0.95 * Math.cos(-midAngle * RADIAN);
      const lineY1 = cy + outerRadius * 0.95 * Math.sin(-midAngle * RADIAN);
      const lineX2 = cx + outerRadius * 1.05 * Math.cos(-midAngle * RADIAN);
      const lineY2 = cy + outerRadius * 1.05 * Math.sin(-midAngle * RADIAN);
      
      return (
        <>
          <line 
            x1={lineX1} 
            y1={lineY1} 
            x2={lineX2} 
            y2={lineY2} 
            stroke={COLORS[index]} 
            strokeWidth={2} 
          />
          <text 
            x={x} 
            y={y} 
            fill={COLORS[index]}
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            fontSize="13px"
            fontWeight="600"
            style={{ 
              filter: 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.8))',
              pointerEvents: 'none'
            }}
          >
            {`${name}: ${(percent * 100).toFixed(0)}%`}
          </text>
        </>
      );
    } else {
      // Original in-chart labels for smaller screens
      // Simplified labels on small screens
      const simpleLabel = width < 576;
      
      // Calculate positioning
      const radius = innerRadius + (outerRadius - innerRadius) * (simpleLabel ? 0.4 : 0.6);
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
      return (
        <text 
          x={x} 
          y={y} 
          fill="#ffffff"
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={simpleLabel ? "10px" : "12px"}
          fontWeight="500"
          style={{ pointerEvents: 'none' }} // Prevent labels from capturing mouse events
        >
          {simpleLabel ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
        </text>
      );
    }
  }, [width, COLORS]);

  return (
    <Card className={`shadow-card overflow-hidden ${isAnimating ? 'chart-appear' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium text-gray-200">Employee Flag Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPC>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false} // Disable default label lines as we're handling them manually
                outerRadius={width < 576 ? 80 : width >= 768 ? 90 : 100}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
                animationBegin={300}
                animationEasing="ease-out"
                label={renderCustomizedLabel}
                onClick={handleClick}
                onMouseEnter={(data, index) => {
                  setHoverSlice(index);
                }}
                onMouseLeave={() => {
                  setHoverSlice(null);
                }}
                isAnimationActive={false} // Disable animation on updates to prevent flickering
                strokeWidth={1}
                stroke="#131313"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={(activeSlice === index || debouncedHoverSlice === index) ? 3 : 1}
                    stroke={(activeSlice === index || debouncedHoverSlice === index) ? COLORS[index] : '#131313'}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} employees`, name]}
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: 'none',
                  color: '#f0f0f0'
                }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                iconSize={10}
                formatter={renderColorfulLegendText}
              />
            </RechartsPC>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
