import { useEffect, useState, forwardRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useTheme } from "@mui/material/styles";
import { Routes, Route, useNavigate, Link as RouteLink, useLocation } from "react-router-dom";
import Cookies from 'universal-cookie';
import Box from "@mui/material/Box";
import Collapse from '@mui/material/Collapse';
import Stack from "@mui/material/Stack";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import KeyIcon from '@mui/icons-material/Key';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SupportIcon from '@mui/icons-material/Support';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Link from "@mui/material/Link";
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from "@mui/material/FormHelperText";
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import Chip from '@mui/material/Chip';
import DirectionsIcon from '@mui/icons-material/Directions';
import Slide from '@mui/material/Slide';
import Portal from '@mui/material/Portal';
import LinearProgress from '@mui/material/LinearProgress';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { useSnackbar } from 'notistack';
import { useHotkeys } from 'react-hotkeys-hook';
import titleState from "~/state/title";
import userState from "~/state/user";
import { SecretCodeProvider } from "../comp/secretcode";
import sidebarState from "~/state/sidebar";
import progressState from "~/state/progress";
import codeState from "~/state/code";
import { get } from "~/rest";
import Banner from '~/img/banner.png';
import BannerDark from '~/img/banner-dark.png';
import { useColorModeContent } from "~/app";
import Sidebar from "./sidebar";
import urlCodes from "./sidebar/codes";
import NotFound from "./notfound";
import About from "./about";
import Codes from "./codes";
import Dashboard from "./dashboard";
import System from "./system";
import Tree from "./tree";
import User from "./user";

export default function Index() {
  const location = useLocation();
  const sidebar = useRecoilValue(sidebarState);
  const progress = useRecoilValue(progressState);
  const setCode = useSetRecoilState(codeState);
  const [progressVisible, setProgressVisible] = useState(false);

  // ???????????????????????????
  useEffect(() => {
    if (progress) {
      const timer = setTimeout(() => { setProgressVisible(progress); }, 300)
      return () => { clearTimeout(timer); }
    } else {
      setProgressVisible(false);
    }
  }, [progress]);

  // ?????? pathname ????????????????????????
  useEffect(() => {
    try {
      const entries = Object.entries(urlCodes);
      let found = false;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const { to } = entry[1];
        if (to === location.pathname) {
          setCode(parseInt(entry[0]));
          found = true;
          break;
        }
      }
      if (!found) {
        setCode(0);
      }
    } catch (err) {
      console.error('change code error:' + err.message)
    }
  }, [location.pathname, setCode]);

  return (
    <SecretCodeProvider>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        {progressVisible &&
          <Portal>
            <LinearProgress sx={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 'modal'
            }} />
          </Portal>
        }
        <Collapse orientation="horizontal" in={sidebar}>
          <Sidebar />
        </Collapse>
        <Stack sx={{ flex: 1, height: '100vh', '@media print': { height: '100%' } }}>
          <Appbar />
          <Box sx={{ maxHeight: '100%', overflow: 'scroll' }}>
            <Routes>
              <Route path='/' element={<Dashboard />} />
              <Route path='user/*' element={<User />} />
              <Route path='system/*' element={<System />} />
              <Route path='tree/*' element={<Tree />} />
              <Route path='codes' element={<Codes />} />
              <Route path='about' element={<About />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </Box>
        </Stack>
      </Box>
    </SecretCodeProvider>
  )
}

function Appbar(params) {
  const theme = useTheme();
  const colorMode = useColorModeContent();
  const navigate = useNavigate();
  const title = useRecoilValue(titleState);
  const [user, setUser] = useRecoilState(userState);
  const [sidebar, setSidebar] = useRecoilState(sidebarState);
  const [anchorEl, setAnchorEl] = useState(null);
  const sidebarOpen = Boolean(anchorEl);
  const { enqueueSnackbar } = useSnackbar();
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  useHotkeys('ctrl+k, cmd+k', () => { setNavigatorOpen(true); }, {
    enableOnTags: ['INPUT'],
  });
  useHotkeys('ctrl+h, cmd+h', () => { setSidebar(!sidebar); }, {
    enableOnTags: ['INPUT'],
  });

  const Logo = theme.palette.mode === 'dark' ? BannerDark : Banner;

  useEffect(() => { document.title = title; }, [title])

  useEffect(() => {
    // ?????? token ??????????????????????????????
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('last-access', window.location.pathname);
      return navigate('/signin', { replace: true });
    }
    // ??????????????????
    if (!user || !user.userid) {
      (async () => {
        try {
          const resp = await get('/user/info');
          if (!resp || !resp.userid) {
            return enqueueSnackbar('??????????????????????????????', { variant: 'error' });
          }
          setUser({
            userid: resp.userid,
            avatar: resp.avatar ? `/image/?u=${resp.avatar}` : '',
            name: resp.name,
            mobile: resp.mobile,
            email: resp.email,
            address: resp.address,
            secretcode_isset: resp.secretcode_isset,
            totp_isset: resp.totp_isset,
            allows: resp.allows,
          });
        } catch (err) {
          enqueueSnackbar(err.message, { variant: 'error' });
        }
      })();
    }
  }, [user, setUser, navigate, enqueueSnackbar]);

  // ??????/?????? ?????????
  const openSidebarClick = () => {
    setSidebar(!sidebar);
  }

  // ????????????
  const onQuickNavigate = () => {
    setNavigatorOpen(true);
  }

  const onUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const onUserMenuClose = () => {
    setAnchorEl(null);
  };

  // ????????????
  const onProfile = () => {
    onUserMenuClose();
    navigate('user/profile');
  }

  // ????????????
  const onChangePassword = () => {
    setAnchorEl(null);
    navigate('user/password');
  }

  // ????????????
  const onSecurity = () => {
    onUserMenuClose();
    navigate('user/security');
  }

  // ??????
  const onAbout = () => {
    onUserMenuClose();
    navigate('/about');
  }

  // ????????????
  const onLogout = () => {
    const cookies = new Cookies();
    cookies.remove('csrf', { path: '/' });
    localStorage.removeItem('token');
    setUser(null);
    setAnchorEl(null);
    enqueueSnackbar('???????????????', { variant: 'success' });
    setTimeout(() => { window.location.href = '/signin'; }, 500);
  }

  return (
    <AppBar position="static" color='transparent' elevation={1} sx={{ zIndex: 1 }}>
      <Toolbar>
        <IconButton aria-label="??????" sx={{ mr: 1 }} color='primary'
          onClick={openSidebarClick}>
          {sidebar ?  <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
        {!sidebar &&
          <Link component={RouteLink} to='/' sx={{ mr: 2, lineHeight: 1 }}>
            <img src={Logo} alt='Logo' height='30px' width='126px' />
          </Link>
        }
        <Typography component='h1' variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Chip label='CTRL+K' variant='outlined' color='info' icon={<DirectionsIcon />}
          onClick={onQuickNavigate}
        />
        <IconButton aria-label="??????????????????"
          onClick={colorMode.toggleColorMode} color="primary" sx={{ mx: 1 }}>
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Button
          aria-label="????????????"
          title="????????????"
          aria-controls={sidebarOpen ? '????????????' : undefined}
          aria-haspopup="true"
          aria-expanded={sidebarOpen ? 'true' : undefined}
          onClick={onUserMenuOpen}>
          {user?.name || user?.userid || 'WhoAmI'}
        </Button>
        <Menu anchorEl={anchorEl} open={sidebarOpen} onClose={onUserMenuClose}>
          <MenuItem onClick={onProfile}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>????????????</ListItemText>
          </MenuItem>
          <MenuItem onClick={onChangePassword}>
            <ListItemIcon>
              <KeyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>????????????</ListItemText>
          </MenuItem>
          <MenuItem onClick={onSecurity}>
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>????????????</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={onAbout}>
            <ListItemIcon>
              <SupportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>??????</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>????????????</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
      <QuickNavigator open={navigatorOpen} setOpen={setNavigatorOpen} />
    </AppBar>
  )
}

const SlideTransition = forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

// ????????????
function QuickNavigator(props) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState('');

  const onClose = () => {
    setCodeInput('');
    setMessage('');
    props.setOpen(false);
  }

  const onCodeChange = e => {
    setMessage('');
    setCodeInput(e.target.value);
  }

  const onKeyDown = e => {
    if (e.key !== 'Enter') {
      return;
    }
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (codeInput.length < 3) {
      return;
    }
    try {
      const codeVal = parseInt(codeInput);
      const item = urlCodes[codeVal];
      if (item && item.to) {
        onClose();
        navigate(item.to);
      } else {
        setCodeInput('');
        setMessage(`?????? ${codeInput} ???????????????????????????`);
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  }

  const onViewCodes = () => {
    onClose();
    navigate('/codes');
  }

  return (
    <Dialog open={props.open} onClose={onClose}
      PaperProps={{ sx: { alignSelf: 'flex-start' } }}
      TransitionComponent={SlideTransition}>
      <DialogContent>
        <TextField autoFocus label="????????????" variant="outlined"
          placeholder="3???4????????????????????????"
          InputProps={{
            endAdornment:
              <InputAdornment position="end"><KeyboardReturnIcon /></InputAdornment>
          }}
          inputProps={{ maxLength: 4 }}
          value={codeInput} onChange={onCodeChange} onKeyDown={onKeyDown}
        />
        {message ?
          <FormHelperText error>{message}</FormHelperText>
          :
          <FormHelperText>
            <Link component='button' variant='caption' underline='none'
              onClick={onViewCodes}>
              ??????????????????-911
            </Link>
          </FormHelperText>
        }
      </DialogContent>
    </Dialog>
  )
}
