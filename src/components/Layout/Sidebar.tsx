import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Stock Analysis', url: '/analysis', icon: LineChart },
  { title: 'Portfolio', url: '/portfolio', icon: Briefcase },
  { title: 'Compare', url: '/compare', icon: BarChart3 },
  { title: 'About', url: '/about', icon: Info },
];

export function Sidebar() {
  const { open: isOpen } = useSidebar();

  return (
    <ShadcnSidebar className={isOpen ? 'w-64' : 'w-14'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            {isOpen && 'Stock Analyzer'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {isOpen && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
}
