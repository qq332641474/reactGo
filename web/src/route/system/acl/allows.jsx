import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSetRecoilState } from "recoil";
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSnackbar } from 'notistack';
import { useHotkeys } from 'react-hotkeys-hook';
import OutlinedPaper from "~/comp/outlined-paper";
import urlCodes from "~/route/sidebar/codes";
import titleState from "~/state/title";
import progressState from '~/state/progress';
import { post, get, put } from '~/rest';

export default function Allows() {
  const location = useLocation();
  const navigate = useNavigate();
  const setTitle = useSetRecoilState(titleState);
  const setProgress = useSetRecoilState(progressState);
  const { enqueueSnackbar } = useSnackbar();
  const [refresh, setRefresh] = useState(true);
  const [codeList, setCodeList] = useState([]);
  const [nCodeChecked, setNCodeChecked] = useState(0);
  const [codeAllChecked, setCodeAllChecked] = useState(false);
  const [codeAllInterminate, setCodeAllInterminate] = useState(false);
  const [allowList, setAllowList] = useState([]);
  const [nAllowChecked, setNAllowChecked] = useState(0);
  const [allowAllChecked, setAllowAllChecked] = useState(false);
  const [allowAllInterminate, setAllowAllInterminate] = useState(false);
  const [updated, setUpdated] = useState(false);

  useHotkeys('esc', () => { navigate('..'); }, { enableOnTags: ["INPUT"] });
  useEffect(() => { setTitle('??????????????????'); }, [setTitle]);

  // ???????????????????????????
  useEffect(() => {
    (async () => {
      try {
        if (location?.state?.acl && refresh) {
          setProgress(true);

          const params = new URLSearchParams({ acl: location.state.acl });
          const resp = await get('/system/acl/allow/list?' + params.toString());
          const allows = resp.allows || [];
          setAllowList(allows);

          // ???????????????????????????
          const list = Object.keys(urlCodes).map(code => {
            // free ???????????????????????????????????????
            if (urlCodes[code].omit) {
              return null;
            }
            for (let i = 0; i < allows.length; i++) {
              if (parseInt(allows[i].code) === parseInt(code)) {
                return null;
              }
            }
            return {
              code: parseInt(code),
              title: urlCodes[code].title,
              url: urlCodes[code].to,
            };
          });
          setCodeList(list.filter(i => i !== null));
        }
      } catch (err) {
        enqueueSnackbar(err.message);
      } finally {
        setProgress(false);
        setRefresh(false);
      }
    })();
  }, [enqueueSnackbar, location?.state?.acl, setProgress, refresh]);

  // ????????????????????????
  useEffect(() => {
    const nchecked = codeList.filter(i => i.checked)?.length || 0;
    if (nchecked === 0 || nchecked === codeList.length) {
      setCodeAllInterminate(false);
    } else {
      setCodeAllInterminate(true);
    }
    setCodeAllChecked(nchecked === codeList.length);
    setNCodeChecked(nchecked);
  }, [codeList]);

  // ????????????????????????
  const onCodeCheckAll = e => {
    const list = codeList.map(i => {
      i.checked = e.target.checked;
      return i;
    });
    setCodeList(list);
  }

  // ??????????????????
  const onCodeCheck = (e, index) => {
    const list = [...codeList];
    list[index].checked = !list[index].checked;
    setCodeList(list);
  }

  // ????????????????????????
  useEffect(() => {
    const nchecked = allowList.filter(i => i.checked)?.length || 0;
    if (nchecked === 0 || nchecked === allowList.length) {
      setAllowAllInterminate(false);
    } else {
      setAllowAllInterminate(true);
    }
    setAllowAllChecked(nchecked === allowList.length);
    setNAllowChecked(nchecked);
  }, [allowList]);

  // ????????????????????????
  const onAllowCheckAll = e => {
    const list = allowList.map(i => {
      i.checked = e.target.checked;
      return i;
    });
    setAllowList(list);
  }

  // ??????????????????
  const onAllowCheck = (e, index) => {
    const list = [...allowList];
    list[index].checked = !list[index].checked;
    setAllowList(list);
  }

  // ??????
  const onAddClick = async () => {
    try {
      const entries = codeList.filter(i => {
        return i.checked;
      })
      await post('/system/acl/allow/add', new URLSearchParams({
        acl: location?.state?.acl,
        entries: JSON.stringify(entries),
      }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setRefresh(true);
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ??????
  const onRemoveClick = async () => {
    try {
      const entries = allowList.filter(i => {
        return i.checked;
      })
      await post('/system/acl/allow/remove', new URLSearchParams({
        acl: location?.state?.acl,
        entries: JSON.stringify(entries),
      }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setRefresh(true);
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ??????????????????
  const onAllowReadCheck = async row => {
    let { iread, iwrite, iadmin } = row;

    // ?????????????????????????????????????????????????????????????????????????????????
    if (row.iread) {
      [iread, iwrite, iadmin] = [false, false, false];
    } else {
      [iread, iwrite, iadmin] = [true, false, false];
    }
    await onAllowUpdateCheck(row.uuid, iread, iwrite, iadmin);
  }

  // ???????????????
  const onAllowWriteCheck = async row => {
    let { iread, iwrite, iadmin } = row;

    // ????????????????????????????????????????????????????????????????????????
    if (row.iwrite) {
      [iwrite, iadmin] = [false, false];
    } else {
      [iread, iwrite] = [true, true];
    }
    await onAllowUpdateCheck(row.uuid, iread, iwrite, iadmin);
  }

  // ??????????????????
  const onAllowAdminCheck = async row => {
    let { iread, iwrite, iadmin } = row;

    // ???????????????????????????????????????
    if (row.iadmin) {
      iadmin = false
    } else {
      [iread, iwrite, iadmin] = [true, true, true];
    }
    await onAllowUpdateCheck(row.uuid, iread, iwrite, iadmin);
  }

  // ????????????
  const onAllowUpdateCheck = async (uuid, iread, iwrite, iadmin) => {
    try {
      setUpdated(true);

      await put('/system/acl/allow/update', new URLSearchParams({
        uuid, iread, iwrite, iadmin,
      }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setRefresh(true);
    } catch (err) {
      enqueueSnackbar(err.message);
    } finally {
      setUpdated(false);
    }
  }

  if (!location?.state?.acl) {
    return <Navigate to='..' replace />
  }

  const { innerHeight: height } = window;
  const maxHeight = height - 210;

  return (
    <Container as='main' maxWidth='md' sx={{ py: 4 }}>
      <Stack direction='row' alignItems='center' sx={{ mb: 3 }}>
        <IconButton aria-label='??????' onClick={() => { navigate('..') }}>
          <ArrowBackIcon color='primary' />
        </IconButton>
        <Stack sx={{ flex: 1, ml: 1 }}>
          <Typography variant='h6'>{location?.state?.name}</Typography>
          <Typography variant='body2'>{location?.state?.summary}</Typography>
        </Stack>
      </Stack>
      <Stack direction='row' alignItems='center' spacing={2}>
        <TableContainer component={OutlinedPaper} sx={{
          flex: 3, height: maxHeight, overflow: 'scroll'
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell as='td' align='center' padding='checkbox'>
                  <Checkbox checked={codeAllChecked} onChange={onCodeCheckAll}
                    indeterminate={codeAllInterminate}
                    inputProps={{ "aria-label": "????????????" }}
                  />
                </TableCell>
                <TableCell align='center'>??????</TableCell>
                <TableCell align='center'>??????</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codeList.map((row, index) => (
                <TableRow key={row.code} hover selected={row.checked === true}
                  sx={{ '> td, > th': { border: 0 } }}>
                  <TableCell align='center' padding='checkbox'>
                    <Checkbox checked={row.checked === true}
                      onChange={e => onCodeCheck(e, index)}
                      inputProps={{ "aria-label": "??????" }}
                    />
                  </TableCell>
                  <TableCell align="center">{row.code}</TableCell>
                  <TableCell align="center">{row.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack spacing={2}>
          <Button endIcon={<ArrowForwardIcon />}
            disabled={nCodeChecked === 0} onClick={onAddClick}>
            ?????? {nCodeChecked} ???
          </Button>
          <Button color='warning' startIcon={<ArrowBackIcon />}
            disabled={nAllowChecked === 0} onClick={onRemoveClick}>
            ?????? {nAllowChecked} ???
          </Button>
        </Stack>
        <TableContainer component={OutlinedPaper} sx={{
          flex: 5, height: maxHeight, overflow: 'scroll'
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell as='td' align='center' padding='checkbox'>
                  <Checkbox checked={allowAllChecked} onChange={onAllowCheckAll}
                    indeterminate={allowAllInterminate}
                    inputProps={{ "aria-label": "????????????" }}
                  />
                </TableCell>
                <TableCell align='center'>??????</TableCell>
                <TableCell align='center'>??????</TableCell>
                <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
                  ??????
                </TableCell>
                <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
                  ??????
                </TableCell>
                <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
                  ??????
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allowList.map((row, index) => (
                <TableRow key={row.code} hover selected={row.checked === true}
                  sx={{ '> td, > th': { border: 0 } }}>
                  <TableCell align='center' padding='checkbox'>
                    <Checkbox checked={row.checked === true}
                      onChange={e => onAllowCheck(e, index)}
                      inputProps={{ "aria-label": "??????" }}
                    />
                  </TableCell>
                  <TableCell align="center">{row.code}</TableCell>
                  <TableCell align="center">{row.title}</TableCell>
                  <TableCell align="center" padding='checkbox'>
                    <Checkbox disabled={updated} checked={row.iread} color='success'
                      onChange={e => { onAllowReadCheck(row); }}
                      inputProps={{ "aria-label": "????????????" }}
                    />
                  </TableCell>
                  <TableCell align="center" padding='checkbox'>
                    <Checkbox disabled={updated} checked={row.iwrite} color='success'
                      onChange={e => { onAllowWriteCheck(row); }}
                      inputProps={{ "aria-label": "????????????" }}
                    />
                  </TableCell>
                  <TableCell align="center" padding='checkbox'>
                    <Checkbox disabled={updated} checked={row.iadmin} color='success'
                      onChange={e => { onAllowAdminCheck(row); }}
                      inputProps={{ "aria-label": "????????????" }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Container>
  )
}
