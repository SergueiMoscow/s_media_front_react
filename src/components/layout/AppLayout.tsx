import { useState, type ReactNode } from 'react';
import {
  AppBar,
  Box,
  Button,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import FaceOutlinedIcon from '@mui/icons-material/FaceOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStorages, queryKeys } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useColorMode } from '../../ColorModeContext';

const DRAWER_WIDTH = 260;

interface NavItem {
  title: string;
  path: string;
  icon: ReactNode;
  requiresAuth: boolean;
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalogsOpen, setCatalogsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const storagesQuery = useQuery({
    queryKey: queryKeys.storages(),
    queryFn: () => fetchStorages(),
    enabled: isAuthenticated,
  });

  const navItems: NavItem[] = [
    { title: 'Домашняя', path: '/', icon: <HomeOutlinedIcon />, requiresAuth: false },
    { title: 'Хранилища', path: '/folder_content', icon: <FolderOutlinedIcon />, requiresAuth: true },
    { title: 'Серверы', path: '/storages', icon: <DnsOutlinedIcon />, requiresAuth: true },
    { title: 'Анализатор', path: '/analyzer', icon: <InsightsIcon />, requiresAuth: true },
    { title: 'Лица', path: '/faces', icon: <FaceOutlinedIcon />, requiresAuth: true },
    { title: 'О системе', path: '/about', icon: <InfoOutlinedIcon />, requiresAuth: false },
  ];

  const visibleItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="menu"
            onClick={() => setDrawerOpen((v) => !v)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Media Explorer
          </Typography>
          <IconButton color="inherit" onClick={toggleColorMode} aria-label="Переключить тему">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          ) : (
            <Button color="inherit" onClick={() => handleNavigate('/login')}>
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {visibleItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={isActive(item.path)}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            ))}

            {isAuthenticated && (
              <>
                <ListItemButton onClick={() => setCatalogsOpen((v) => !v)}>
                  <ListItemIcon>
                    <FolderOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Каталоги" />
                  {catalogsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={catalogsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {storagesQuery.data?.map((storage) => (
                      <ListItemButton
                        key={storage.id}
                        sx={{ pl: 4 }}
                        onClick={() =>
                          handleNavigate(
                            `/catalog_content/${storage.server_id}/${storage.id}`,
                          )
                        }
                      >
                        <ListItemIcon>
                          <FolderOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={storage.name} />
                      </ListItemButton>
                    ))}
                    {storagesQuery.data?.length === 0 && (
                      <ListItemButton sx={{ pl: 4 }} disabled>
                        <ListItemText primary="Нет хранилищ" />
                      </ListItemButton>
                    )}
                  </List>
                </Collapse>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          pt: 2,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
