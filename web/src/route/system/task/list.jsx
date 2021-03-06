import { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
import RestoreIcon from '@mui/icons-material/Restore';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import dayjs from 'dayjs';
import titleState from "~/state/title";
import progressState from "~/state/progress";
import SearchInput from '~/comp/search-input';
import OutlinedPaper from '~/comp/outlined-paper';
import { useSecretCode } from '~/comp/secretcode';
import usePageData from '~/hook/pagedata';
import { post, del } from '~/rest';

export default function List() {
  const navigate = useNavigate();
  const setTitle = useSetRecoilState(titleState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [pageData, setPageData] = usePageData();
  const { enqueueSnackbar } = useSnackbar();
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(pageData('rowsPerPage') || 10);
  const [refresh, setRefresh] = useState(true);

  useEffect(() => { setTitle('????????????'); }, [setTitle]);

  const requestRefresh = () => { setRefresh(!refresh); }

  useEffect(() => {
    (async () => {
      try {
        setProgress(true);

        const resp = await post('/system/task/list', new URLSearchParams({
          page, rows, keyword,
        }));
        setCount(resp.count || 0);
        setList(resp.list || []);
      } catch (err) {
        enqueueSnackbar(err.message);
      } finally {
        setProgress(false);
      }
    })();
  }, [ enqueueSnackbar, setProgress, page, rows, keyword, refresh ]);

  // ??????
  const onKeywordChange = value => {
    setKeyword(value);
    setPage(0);
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
        <Typography textAlign='right' sx={{ flex: 1 }} variant='caption' />
        <Stack direction='row' spacing={1}>
          <Button startIcon={<AddIcon />} onClick={() => { navigate('add') }}>
            ??????
          </Button>
          <Button color='warning' onClick={() => { navigate('entries') }}>
          ??????
        </Button>
        </Stack>
      </Toolbar>
      <TableContainer component={OutlinedPaper}>
        <Table size='medium'>
          <TableHead>
            <TableRow sx={{ whiteSpace:'nowrap' }}>
              <TableCell align='center'>??????</TableCell>
              <TableCell align='center'>CRON</TableCell>
              <TableCell align='center'>??????</TableCell>
              <TableCell align='center'>??????</TableCell>
              <TableCell align='center'>????????????</TableCell>
              <TableCell align='center'>??????????????????</TableCell>
              <TableCell as='td' align='right' colSpan={2} padding='checkbox' />
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(t => (
              <TableRow hover key={t.uuid} disabled={t.disabled}>
                <TableCell align="center">{t.name}</TableCell>
                <TableCell align="center"><code>{t.cron}</code></TableCell>
                <TableCell align="center">
                  {t.type === 1 ? '??????' : '??????'}
                </TableCell>
                <TableCell align="center">{t.path}</TableCell>
                <TableCell align="center">{t.nfire}</TableCell>
                <TableCell align="center">
                  {dayjs(t.last_fire).format('YY-MM-DD HH:mm:ss')}
                </TableCell>
                <TableCell align="right" padding='none'>
                  {t.disabled &&
                    <BlockIcon color='warning' fontSize='small'
                      sx={{ verticalAlign: 'middle' }}
                    />
                  }
                </TableCell>
                <TableCell align="right" padding='checkbox'>
                  <UserMenuIconButton task={t} requestRefresh={requestRefresh} />
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
                SelectProps={{ inputProps: { 'aria-label': '????????????' } }}
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
  const confirm = useConfirm();
  const secretCode = useSecretCode();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const { task, requestRefresh } = props;

  const onClose = () => {
    setAnchorEl(null);
  };

  // ??????
  const onInfoClick = () => {
    setAnchorEl(null);
    navigate('info', { state: { uuid: task.uuid } });
  };

  // ??????
  const onModifyClick = () => {
    setAnchorEl(null);
    navigate('modify', { state: { uuid: task.uuid } });
  };

  // ????????????
  const onFireClick = async () => {
    try {
      setAnchorEl(null);

      await confirm({
        description: `????????????????????? ${task?.name} ??????`,
        confirmationText: '????????????',
        confirmationButtonProps: { color: 'warning' },
      });

      await post('/system/task/fire', new URLSearchParams({ uuid: task.uuid }));
      enqueueSnackbar('?????????', { variant: 'success' });
      requestRefresh();
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
        description: task.disabled ?
          `??????????????? ${task?.name} ?????????????????????????????????????????????????????????????????????`
          :
          `??????????????? ${task?.name} ??????????????????????????????????????????????????????`,
        confirmationText: task.disabled ? '??????' : '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await post('/system/task/disable',
        new URLSearchParams({ uuid: task.uuid })
      );
      enqueueSnackbar('????????????', { variant: 'success' });
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
        description: `??????????????? ${task?.name} ??????????????????????????????`,
        confirmationText: '??????',
        confirmationButtonProps: { color: 'error' },
      });

      const token = await secretCode();

      const params = new URLSearchParams({
        secretcode_token: token, uuid: task.uuid
      });
      await del('/system/task/delete?' + params.toString());
      enqueueSnackbar('?????????', { variant: 'success' });
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
        <MenuItem onClick={onInfoClick}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={onModifyClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>??????</ListItemText>
        </MenuItem>
        <MenuItem disabled={task.disabled} onClick={onFireClick}>
          <ListItemIcon>
            <LocalFireDepartmentIcon fontSize="small" color='error' />
          </ListItemIcon>
          <ListItemText>????????????</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem disabled={task.deleted} onClick={onDisableClick}>
          <ListItemIcon>
            {task.disabled ?
              <RestoreIcon fontSize="small" color='warning' />
              :
              <BlockIcon fontSize="small" color='warning' />
            }
          </ListItemIcon>
          {task.disabled ?
            <ListItemText>??????</ListItemText>
            :
            <ListItemText>??????</ListItemText>
          }
        </MenuItem>
        <MenuItem disabled={task.deleted} onClick={onDeleteClick}>
          <ListItemIcon>
            <RemoveCircleOutlineIcon fontSize="small" color='error' />
          </ListItemIcon>
          <ListItemText>??????</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
