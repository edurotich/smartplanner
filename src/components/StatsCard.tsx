"use client";
import React, { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import AnimatedElement from './AnimatedElement';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number; // Percentage change, positive or negative
  trendLabel?: string;
  color?: 'default' | 'emerald' | 'gold' | 'terracotta';
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel = 'vs last period',
  color = 'default'
}: StatsCardProps) {
  
  const colorClasses = {
    default: {
      bg: 'from-wood-100 to-wood-200/50',
      icon: 'bg-wood-500 text-wood-50',
      trend: {
        positive: 'text-accent-emerald',
        negative: 'text-accent-terracotta',
        neutral: 'text-wood-500'
      }
    },
    emerald: {
      bg: 'from-accent-emeraldLight/30 to-accent-emeraldLight/10',
      icon: 'bg-accent-emerald text-white',
      trend: {
        positive: 'text-accent-emerald',
        negative: 'text-accent-terracotta',
        neutral: 'text-wood-500'
      }
    },
    gold: {
      bg: 'from-accent-goldLight/30 to-accent-goldLight/10',
      icon: 'bg-accent-gold text-white',
      trend: {
        positive: 'text-accent-emerald',
        negative: 'text-accent-terracotta',
        neutral: 'text-wood-500'
      }
    },
    terracotta: {
      bg: 'from-accent-terracottaLight/30 to-accent-terracottaLight/10',
      icon: 'bg-accent-terracotta text-white',
      trend: {
        positive: 'text-accent-emerald',
        negative: 'text-accent-terracotta',
        neutral: 'text-wood-500'
      }
    }
  };
  
  let trendType: 'positive' | 'negative' | 'neutral' = 'neutral';
  let TrendIcon = Minus;
  
  if (trend) {
    if (trend > 0) {
      trendType = 'positive';
      TrendIcon = ArrowUpRight;
    } else if (trend < 0) {
      trendType = 'negative';
      TrendIcon = ArrowDownRight;
    }
  }

  return (
    <AnimatedElement animation="scale">
      <div className={`bg-gradient-to-br ${colorClasses[color].bg} rounded-2xl border border-amber-300/30 p-5 shadow-amber transition-all duration-300 hover:shadow-amber-lg hover:scale-[1.02]`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-amber-700 text-sm font-medium mb-1">{title}</h3>
            <p className="text-amber-900 text-2xl font-bold">{value}</p>
            
            {trend !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${colorClasses[color].trend[trendType]}`}>
                <TrendIcon className="w-4 h-4 mr-1" />
                <span className="font-medium">{Math.abs(trend)}%</span>
                <span className="text-amber-600 ml-1 text-xs">{trendLabel}</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={`${colorClasses[color].icon} p-3 rounded-xl shadow-md`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </AnimatedElement>
  );
}