import { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import SecurityIcon from '@mui/icons-material/Security';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import KeyIcon from '@mui/icons-material/Key';
import KeyOffIcon from '@mui/icons-material/KeyOff';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import dayjs from 'dayjs';
import titleState from "~/state/title";
import userState from "~/state/user";
import progressState from "~/state/progress";
import SearchInput from '~/comp/search-input';
import OutlinedPaper from '~/comp/outlined-paper';
import { useSecretCode } from '~/comp/secretcode';
import usePageData from '~/hook/pagedata';
import { post, del, get } from '~/rest';

export default function List() {
  const navigate = useNavigate();
  const setTitle = useSetRecoilState(titleState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [pageData, setPageData] = usePageData();
  const { enqueueSnackbar } = useSnackbar();
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [acls, setAcls] = useState([]);
  const [acl, setAcl] = useState('all');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(pageData('rowsPerPage') || 10);
  const [refresh, setRefresh] = useState(true);

  useEffect(() => { setTitle('????????????'); }, [setTitle]);

  const requestRefresh = () => { setRefresh(!refresh); }

  useEffect(() => {
    (async () => {
      try {
        const resp = await get('/system/acl/');
        setAcls(resp.acls || []);
      } catch (err) {
        enqueueSnackbar(err.message);
      }
    })();
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    (async () => {
      try {
        setProgress(true);

        const resp = await post('/system/user/list', new URLSearchParams({
          page, rows, keyword, acl,
        }));
        setCount(resp.count || 0);
        setList(resp.list || []);
      } catch (err) {
        enqueueSnackbar(err.message);
      } finally {
        setProgress(false);
      }
    })();
  }, [ enqueueSnackbar, setProgress, page, rows, keyword, acl, refresh ]);

  // ??????
  const onKeywordChange = value => {
    setPage(0);
    setKeyword(value);
  }

  // ????????????
  const onAclChange = e => {
    setPage(0);
    setAcl(e.target.value);
  }

  // ????????????
  const onPageChange = (e, newPage) => {
    setPage(newPage);
  }

  // ??????????????????
  const onRowsPerPageChange = e => {
    const rows = parseInt(e.target.value, 10);

    setRows(rows);
    setPage(0);
    setPageData('rowsPerPage', rows);
  }

  return (
    <Container as='main' maxWidth='md' sx={{ mb: 4 }}>
      <Toolbar sx={{ mt: 2 }} disableGutters>
        <SearchInput isLoading={progress} onChange={onKeywordChange} />
        <TextField select variant='standard' sx={{ ml: 2, minWidth: 140 }}
          value={acl} onChange={onAclChange}
          InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <Tooltip title='????????????????????????'>
                  <SecurityIcon fontSize='small' sx={{
                    cursor: 'help', color: '#8888'
                  }} />
                </Tooltip>
              </InputAdornment>,
          }}>
          {acls.map(a => (
            <MenuItem key={a.uuid} value={a.uuid}>{a.name}</MenuItem>
          ))}
          <MenuItem value='all'>??????</MenuItem>
        </TextField>
        <Typography textAlign='right' sx={{ flex: 1 }} variant='caption' />
        <Button startIcon={<AddIcon />} onClick={() => { navigate('add') }}>
          ??????
        </Button>
      </Toolbar>
      <TableContainer component={OutlinedPaper}>
        <Table size='medium'>
          <TableHead>
            <TableRow sx={{ whiteSpace:'nowrap' }}>
              <TableCell align='center'>?????????</TableCell>
              <TableCell align='center'>??????</TableCell>
              <TableCell align='center'>????????????</TableCell>
              <TableCell align='center'>????????????</TableCell>
              <TableCell align='center'>???????????? / ??????</TableCell>
              <TableCell as='td' align='right' colSpan={2} padding='checkbox' />
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(u => (
              <TableRow hover key={u.userid}
                disabled={u.disabled} deleted={u.deleted?.toString()}>
                <TableCell align="center">{u.userid}</TableCell>
                <TableCell align="center">{u.name}</TableCell>
                <TableCell align="center">
                  {parseInt(u.acl_code) === 0 ?
                    <Typography variant='body2' color='secondary'>
                      {u.acl_name}
                    </Typography>
                    :
                    <Typography variant='body2'>{u.acl_name}</Typography>
                  }
                </TableCell>
                <TableCell align="center">
                  {dayjs(u.create_at).format('YY-MM-DD HH:mm:ss')}
                </TableCell>
                <TableCell align="center">
                  {dayjs(u.signin_at).format('YY-MM-DD HH:mm:ss')} / {u.n_signin}
                </TableCell>
                <TableCell align="right" padding='none'>
                  {u.deleted &&
                    <RemoveCircleOutlineIcon color='error' fontSize='small'
                      sx={{ verticalAlign: 'middle' }}
                    />
                  }
                  {(u.disabled && !u.deleted) &&
                    <BlockIcon color='warning' fontSize='small'
                      sx={{ verticalAlign: 'middle' }}
                    />
                  }
                </TableCell>
                <TableCell align="right" padding='checkbox' className='action'>
                  <UserMenuIconButton user={u} requestRefresh={requestRefresh} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                colSpan={10}
                count={count}
                rowsPerPage={rows}
                page={page}
                SelectProps={{
                  inputProps: { 'aria-label': '????????????' }
                }}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Container>
  )
}

function UserMenuIconButton(props) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const confirm = useConfirm();
  const secretCode = useSecretCode();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const { user, requestRefresh } = props;

  const onClose = () => {
    setAnchorEl(null);
  };

  // ????????????
  const onProfileClick = () => {
    setAnchorEl(null);
    navigate('profile', { state: { uuid: user.uuid } });
  };

  // ????????????
  const onModifyClick = () => {
    setAnchorEl(null);
    navigate('modify', { state: { uuid: user.uuid } });
  };

  // ????????????
  const onPasswdClick = () => {
    setAnchorEl(null);
    navigate('passwd', { state: { uuid: user.uuid, name: user.name } });
  };

  // ????????????
  const onACLClick = () => {
    setAnchorEl(null);
    navigate('acl', { state: { uuid: user.uuid, name: user.name, acl: user.acl } });
  };

  // ?????????????????????
  const onClearSecretCode = async () => {
    try {
      setAnchorEl(null);

      await confirm({
        description: `??????????????? ${user.name} ????????????????????????`,
        confirmationText: '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await post('/system/user/clearsecretcode',
        new URLSearchParams({ uuid: user.uuid })
      );
      enqueueSnackbar('?????????', { variant: 'success' });

      if (currentUser.userid === user.userid) {
        setCurrentUser({ ...currentUser, secretcode_isset: false });
      }
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ?????????????????????
  const onClearTOTP = async () => {
    try {
      setAnchorEl(null);

      await confirm({
        description: `??????????????? ${user.name} ????????????????????????`,
        confirmationText: '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await post('/system/user/cleartotp',
        new URLSearchParams({ uuid: user.uuid })
      );
      enqueueSnackbar('?????????', { variant: 'success' });

      if (currentUser.userid === user.userid) {
        setCurrentUser({ ...currentUser, totp_isset: false });
      }
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ??????/??????
  const onDisableClick = async () => {
    try {
      setAnchorEl(null);

      await confirm({
        description: user.disabled ?
          `??????????????? ${user.name} ???????????????????????????????????????????????????`
          :
          `??????????????? ${user.name} ??????????????????????????????????????????????????????????????????????????????`,
        confirmationText: user.disabled ? '??????' : '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await post('/system/user/disable',
        new URLSearchParams({ uuid: user.uuid })
      );
      enqueueSnackbar('????????????????????????', { variant: 'success' });
      requestRefresh();
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ??????
  const onDeleteClick = async () => {
    try {
      setAnchorEl(null);

      await confirm({
        description: `????????????????????? ${user.name} ??????????????????????????????????????????????????????????????????????????????!`,
        confirmationText: '??????',
        confirmationButtonProps: { color: 'error' },
      });

      const token = await secretCode();

      const params = new URLSearchParams({
        uuid: user.uuid, secretcode_token: token
      });
      await del('/system/user/delete?' + params.toString());
      enqueueSnackbar('??????????????????', { variant: 'success' });
      requestRefresh();
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  return (
    <>
      <IconButton color='primary'
        aria-label='??????'
        aria-controls={open ? '??????' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={e => { setAnchorEl(e.currentTarget); }}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <MenuItem onClick={onProfileClick}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem disabled={user.disabled || user.deleted} onClick={onModifyClick}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <MenuItem disabled={user.disabled || user.deleted} onClick={onPasswdClick}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <MenuItem disabled={user.disabled || user.deleted} onClick={onACLClick}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" color='info' />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem disabled={user.disabled || user.deleted} onClick={onClearSecretCode}>
          <ListItemIcon>
            <KeyOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>?????????????????????</ListItemText>
        </MenuItem>
        <MenuItem disabled={user.disabled || user.deleted} onClick={onClearTOTP}>
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>?????????????????????</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem disabled={user.deleted} onClick={onDisableClick}>
          <ListItemIcon>
            {user.disabled ?
              <SettingsBackupRestoreIcon fontSize="small" color='warning' />
              :
              <BlockIcon fontSize="small" color='warning' />
            }
          </ListItemIcon>
          {user.disabled ?
            <ListItemText>??????</ListItemText>
            :
            <ListItemText>??????</ListItemText>
          }
        </MenuItem>
        <MenuItem disabled={user.deleted} onClick={onDeleteClick}>
          <ListItemIcon>
            <RemoveCircleOutlineIcon fontSize="small" color='error' />
          </ListItemIcon>
          <ListItemText>??????</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
