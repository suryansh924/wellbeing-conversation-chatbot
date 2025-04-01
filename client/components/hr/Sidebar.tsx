import React, { useState } from 'react';
import { 
  BarChart, 
  FileText, 
  LogOut, 
  User,
  Menu,
  LucideIcon,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('analytics-section');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-screen bg-hr-black border-r border-hr-green/30 shadow-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="font-semibold text-lg text-hr-green animate-fade-in">
            Vibemeter HR
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="text-hr-green hover:text-white hover:bg-hr-green/20 transition-colors duration-200"
        >
          <Menu size={20} />
        </Button>
      </div>
      
      <Separator className="my-2 bg-hr-green/20" />
      
      <div className="flex-1 overflow-y-auto hr-custom-scrollbar px-2 py-4 stagger-fade-in">
        <NavItem 
          icon={BarChart} 
          label="Analytics" 
          active={activeSection === 'analytics-section'} 
          collapsed={collapsed} 
          onClick={() => scrollToSection('analytics-section')}
        />
        <NavItem 
          icon={FileText} 
          label="Reports" 
          active={activeSection === 'reports-section'} 
          collapsed={collapsed} 
          onClick={() => scrollToSection('reports-section')}
        />
      </div>
      
      <Separator className="my-2 bg-hr-green/20" />
      
      <div className="p-4">
        <div className={cn(
          "flex flex-col items-center rounded-lg bg-hr-green/10 p-4 transition-all duration-300 hover:bg-hr-green/20",
          collapsed ? "py-2 bg-transparent hover:bg-transparent" : "py-4 bg-hr-green/10 hover:bg-hr-green/20"
        )}>
          <Avatar className={cn("h-20 w-20 border-2 border-hr-green shadow-lg mb-4", collapsed && "h-10 w-10 mb-2")}>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-hr-green text-black font-semibold">JD</AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="text-center space-y-3 animate-fade-in w-full">
              <div className="font-semibold text-hr-green text-lg">John Doe</div>
              <div className="text-sm text-gray-200 font-medium bg-hr-green/20 py-1 px-2 rounded-md">HR Manager</div>
              
              <div className="space-y-2 pt-2 text-left">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Briefcase size={14} className="text-hr-green" />
                  <span>ID: HR-2024-001</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Mail size={14} className="text-hr-green" />
                  <span>john.doe@company.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Phone size={14} className="text-hr-green" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
              
              <Button 
                variant="default" 
                className="w-full mt-2 justify-center gap-2 bg-[#252525] text-hr-green border-hr-green hover:bg-hr-green hover:text-black transition-colors duration-200"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </Button>
            </div>
          )}
          
          {collapsed && (
            <Button 
              variant="default" 
              className="p-2 mt-2 justify-center bg-[#252525] text-hr-green hover:bg-hr-green hover:text-black transition-colors duration-200"
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 my-1 transition-all duration-200", // Changed from my-3 to my-1
        collapsed ? "justify-center p-2" : "px-3 py-2",
        active 
          ? "bg-[#26890d] text-black" 
          : "text-white hover:bg-[#86BC25] hover:text-black"
      )}
      onClick={onClick}
    >
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
    </Button>
  );
}
