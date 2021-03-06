import { useEffect, useState, Fragment } from 'react';
import { useSetRecoilState, useRecoilState } from "recoil";
import {
  useNavigate, useLocation, Navigate, Link as RouteLink
} from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Toolbar from '@mui/material/Toolbar';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableFooter from '@mui/material/TableFooter';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import dayjs from 'dayjs';
import SearchInput from '~/comp/search-input';
import OutlinedPaper from "~/comp/outlined-paper";
import progressState from "~/state/progress";
import titleState from "~/state/title";
import usePageData from '~/hook/pagedata';
import { post, put, del } from '~/rest';

export default function User() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const setTitle = useSetRecoilState(titleState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [pageData, setPageData] = usePageData();
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(pageData('rowsPerPage') || 10);
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [reload, setReload] = useState(true);

  useHotkeys('esc', () => { navigate('..'); }, { enableOnTags: ["INPUT"] });
  useEffect(() => { setTitle('????????????'); }, [setTitle]);

  const { node } = location?.state || {};

  // ?????????????????????
  useEffect(() => {
    (async () => {
      try {
        if (reload) {
          setProgress(true);

          const resp = await post('/tree/node/user/', new URLSearchParams({
            node: node?.uuid, page, rows, keyword,
          }));
          setCount(resp.count || 0);
          setList(resp.list || []);
        }
      } catch (err) {
        enqueueSnackbar(err.message);
      } finally {
        setProgress(false);
        setReload(false);
      }
    })();
  }, [enqueueSnackbar, node, page, rows, keyword, setProgress, reload]);

  // ??????
  const onKeywordChange = value => {
    setPage(0);
    setReload(true);
    setKeyword(value);
  }

  // ????????????
  const onPageChange = (e, newPage) => {
    setReload(true);
    setPage(newPage);
  }

  // ??????????????????
  const onRowsPerPageChange = e => {
    const rows = parseInt(e.target.value, 10);

    setReload(true);
    setRows(rows);
    setPage(0);
    setPageData('rowsPerPage', rows);
  }

  // ????????????
  const onRemoveClick = async row => {
    try {
      await confirm({
        description: `??????????????? ${row.user_name} ???????????????`,
        confirmationText: '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      const params = new URLSearchParams({ uuid: row.uuid });
      await del('/tree/node/user/delete?' + params.toString());
      setReload(true);
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // uuid ????????????????????? state ???????????????????????????????????????????????? url ???????????????
  if (!node?.uuid) {
    return <Navigate to='..' replace />;
  }

  return (
    <Container as='main' role='main' maxWidth='md' sx={{ mb: 4 }}>
      <Paper elevation={3} sx={{ px: 4, py: 3, mt: 5 }}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 3 }}>
          <IconButton aria-label='??????' component={RouteLink} to='..'>
            <ArrowBackIcon color='primary' />
          </IconButton>
          <Stack>
            <Typography variant='h6'>????????????</Typography>
            <Typography variant='caption'>
              ????????????????????????????????? <strong>{node?.name}</strong> (?????????????????????)????????????
            </Typography>
          </Stack>
        </Stack>
        <Toolbar sx={{ mt: 2 }} disableGutters>
          <SearchInput isLoading={progress} onChange={onKeywordChange} />
          <Typography textAlign='right' sx={{ flex: 1 }} variant='caption' />
          <Add node={node} reload={setReload} />
        </Toolbar>
        <TableContainer component={OutlinedPaper}>
          <Table sx={{ minWidth: 650 }} aria-label="??????????????????">
            <TableHead>
              <TableRow>
                <TableCell align="center">??????</TableCell>
                <TableCell align="center">?????????</TableCell>
                <TableCell align="center">????????????</TableCell>
                <TableCell padding='checkbox'></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(row => (
                <TableRow key={row.uuid}>
                  <TableCell align="center">{row.user_name}</TableCell>
                  <TableCell align="center">{row.userid}</TableCell>
                  <TableCell align="center">
                    {dayjs(row.create_at).format('YYYY/MM/DD HH:mm:ss')}
                  </TableCell>
                  <TableCell padding='checkbox'>
                    <IconButton color='error' onClick={() => onRemoveClick(row)}>
                      <RemoveCircleOutlineIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow disabled>
                  <TableCell colSpan={6} align="center">???</TableCell>
                </TableRow>
              )}
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
      </Paper>
    </Container>
  )
}

function Add(props) {
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState([]);
  const [force, setForce] = useState(false);
  const [conflictList, setConflictList] = useState([]);
  const loading = open && options.length === 0;

  const { node, reload } = props;

  // ???????????????
  const onDialogClose = () => {
    setValue([]);
    setForce(false);
    setConflictList([]);
    setDialogOpen(false);
  }

  // ?????????????????????????????????
  useEffect(() => {
    let active = true;

    if (!loading) {
      return undefined;
    }
    (async () => {
      try {
        const resp = await post('/tree/node/user/candidate', new URLSearchParams({
          node: node?.uuid,
        }));
        if (active) {
          setOptions(resp.list || []);
        }
      } catch (err) {
        enqueueSnackbar(err.message);
        setOpen(false);
      }
    })();
    return () => { active = false; };
  }, [loading, enqueueSnackbar, node]);

  // ?????????????????????????????????
  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  // ??????
  const onOK = async () => {
    try {
      if (value.length === 0) {
        return enqueueSnackbar('??????????????????', { variant: 'warning' });
      }
      const users = value.map(v => v.uuid)

      const resp = await put('/tree/node/user/add', new URLSearchParams({
        node: node.uuid, users, force,
      }));
      // ??????????????????????????????????????????
      if (resp.conflict) {
        return setConflictList(resp.list);
      }
      enqueueSnackbar('????????????', { variant: 'success' });
      reload(true);
      onDialogClose();
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  return (
    <>
      <Button startIcon={<AddIcon />} onClick={() => { setDialogOpen(true) }}>
        ??????
      </Button>
      <Dialog onClose={onDialogClose} open={dialogOpen} maxWidth='sm' fullWidth>
        <DialogTitle>??????????????????</DialogTitle>
        <DialogContent>
          <Autocomplete sx={{ mt: 2 }} fullWidth multiple size='small'
            handleHomeEndKeys
            disableCloseOnSelect
            value={value}
            onChange={(_, v) => { setValue(v) }}
            open={open}
            onOpen={() => { setOpen(true); }}
            onClose={() => { setOpen(false); }}
            options={options}
            loading={loading}
            isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox size='small' checked={selected} />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="?????????" placeholder="?????????"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <Fragment>
                      {loading ? <CircularProgress size={20} sx={{ mr: 4 }} /> : null}
                      {params.InputProps.endAdornment}
                    </Fragment>
                  ),
                }}
              />
            )}
          />
          <Collapse in={conflictList.length > 0} sx={{ mt: 4 }}>
            <Typography color='error' variant='body2'>
              ??????????????????????????????????????????????????????????????????????????????????????????????????????
            </Typography>
            <TableContainer component={OutlinedPaper} sx={{ my: 1 }}>
              <Table sx={{ minWidth: 650 }} size='small' aria-label="????????????????????????">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">??????</TableCell>
                    <TableCell align="center">??????</TableCell>
                    <TableCell align="center">????????????</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conflictList.map(row => (
                    <TableRow key={row.uuid}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="center">{row.user_name}</TableCell>
                      <TableCell align="center">{row.node_name}</TableCell>
                      <TableCell align="center">
                        {dayjs(row.create_at).format('YYYY/MM/DD HH:mm:ss')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <FormControlLabel label="??????????????????????????????????????????????????????" control={
              <Switch checked={force} onChange={e => setForce(e.target.checked)} />
            }/>
          </Collapse>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onDialogClose}>??????</Button>
          <Button variant='contained' onClick={onOK}>??????</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
