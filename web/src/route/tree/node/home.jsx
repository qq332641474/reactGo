import { useCallback, useEffect, useState } from 'react';
import { useSetRecoilState } from "recoil";
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TreeView from '@mui/lab/TreeView';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ReplayIcon from '@mui/icons-material/Replay';
import AddIcon from '@mui/icons-material/Add';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BlockIcon from '@mui/icons-material/Block';
import CommitIcon from '@mui/icons-material/Commit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { useConfirm } from 'material-ui-confirm';
import InplaceInput from '~/comp/inplace-input';
import Splitter from '../../../comp/splitter';
import titleState from "~/state/title";
import progressState from "~/state/progress";
import usePageData from '~/hook/pagedata';
import { get, post, put } from '~/rest';
import StyledTreeItem from './treeitem';
import ChangeParent from './parent';

export default function Home() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const setTitle = useSetRecoilState(titleState);
  const setProgress = useSetRecoilState(progressState);
  const [pageData, setPageData] = usePageData();
  const [root, setRoot] = useState('');
  const [tree, setTree] = useState(null);
  const [node, setNode] = useState({});
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [hoverNode, setHoverNode] = useState('');
  const [reload, setReload] = useState(true);
  const [detail, setDetail] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(true);

  useEffect(() => { setTitle('????????????'); }, [setTitle]);

  // ?????? splitter ??? sizes
  const onSplitterResize = (_, newSizes) => {
    localStorage.setItem('tree.splitter.sizes', JSON.stringify(newSizes));
  }

  // ????????????????????? sizes
  let splitSizes = [30,70];
  try {
    const sizes = localStorage.getItem('tree.splitter.sizes');
    if (sizes) {
      splitSizes = JSON.parse(sizes)
    }
  } catch (err) {
    console.error(err.message);
  }

  // ????????????
  const onNodeSelect = useCallback(async (e, nodeIds) => {
    const timer = setTimeout(() => setNodeLoading(true), 500);

    try {
      setSelected(nodeIds);
      setPageData('selected', nodeIds);

      const params = new URLSearchParams({ uuid: nodeIds });
      const resp = await get('/tree/node/info?' + params.toString())
      setNode(resp);
    } catch (err) {
      enqueueSnackbar(err.message);
    } finally {
      clearTimeout(timer);
      setNodeLoading(false);
    }
  }, [enqueueSnackbar, setPageData]);

  // ????????????
  const onNodeToggle = (e, nodeIds) => {
    setExpanded(nodeIds);
    setPageData('expanded', nodeIds);
  }

  // ???????????????
  useEffect(() => {
    (async () => {
      try {
        if (reload) {
          setProgress(true);

          const params = new URLSearchParams({ root: root });
          const resp = await get('/tree/node/?' + params.toString());

          if (resp.tree) {
            setTree(resp.tree || null);

            // ???????????????????????????
            if (!selected) {
              const saved = pageData('selected');
              if (saved) {
                onNodeSelect(null, saved)
              } else {
                onNodeSelect(null, resp.tree.uuid)
              }
            }
            if (expanded.length === 0) {
              const saved = pageData('expanded');
              if (saved && Array.isArray(saved)) {
                setExpanded(saved);
              } else {
                setExpanded([resp.tree.uuid]);
              }
            }
          }
        }
      } catch (err) {
        enqueueSnackbar(err.message);
      } finally {
        setReload(false);
        setProgress(false);
      }
    })();
  }, [enqueueSnackbar, reload, onNodeSelect, selected, root, setProgress,
    expanded, pageData
  ]);

  // ??????????????????
  const onNodeContextMenu = e => {
    e.preventDefault();

    setContextMenu(
      contextMenu === null ? {
        mouseX: e.clientX - 2,
        mouseY: e.clientY - 4,
      } : null,
    );
  }

  // ????????????????????????
  const onSetRootNode = uuid => {
    setContextMenu(null);
    setRoot(hoverNode || selected);
    setReload(true);
  }

  // ?????????????????????
  const onResetRootNode = uuid => {
    setRoot('');
    setReload(true);
  }

  // ?????????????????????
  const onExpandAll = () => {
    setContextMenu(null);

    const target = hoverNode || selected;
    const nodes = [...expanded];
    let tpath = null;

    // ???????????????????????????
    const addNode = uuid => {
      if (!nodes.includes(uuid)) {
        nodes.push(uuid);
      }
    }

    // ????????????
    const expand = (arr) => {
      arr.map(n => {
        if (tpath) {
          if (n.tpath?.startsWith(tpath)) {
            addNode(n.uuid);
          }
        } else {
          if (n.uuid === target) {
            addNode(n.uuid);
            tpath = n.tpath;
          }
        }
        if (n.children) {
          expand(n.children);
        }
        return n;
      });
    }
    if (target === tree.uuid) {
      addNode(tree.uuid);
      tpath = tree.tpath;
      expand(tree.children);
    } else {
      expand(tree.children);
    }
    setExpanded(nodes);
    setSelected(target);
    setPageData('expanded', nodes, 'selected', target);
  }

  // ?????????????????????
  const onCollapseAll = () => {
    setContextMenu(null);

    const target = hoverNode || selected;
    const nodes = [...expanded];
    let tpath = null;

    // ???????????????????????????
    const removeNode = uuid => {
      const i = nodes.indexOf(uuid);
      if (i >= 0) {
        nodes.splice(i, 1);
      }
    }

    // ??????
    const collapse = (arr) => {
      arr.map(n => {
        if (tpath) {
          if (n.tpath?.startsWith(tpath)) {
            removeNode(n.uuid);
          }
        } else {
          if (n.uuid === target) {
            removeNode(n.uuid);
            tpath = n.tpath;
          }
        }
        if (n.children) {
          collapse(n.children);
        }
        return n;
      });
    }
    if (target === tree.uuid) {
      removeNode(tree.uuid);
      tpath = tree.tpath;
      collapse(tree.children);
    } else {
      collapse(tree.children);
    }
    setExpanded(nodes);
    setSelected(target);
    setPageData('expanded', nodes, 'selected', target);
  }

  // ????????????
  const onMoveTop = async () => {
    setContextMenu(null);

    try {
      const target = hoverNode || selected;
      await put('/tree/node/top', new URLSearchParams({ uuid: target }));
      setReload(true);
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ????????????
  const onMoveBottom = async () => {
    setContextMenu(null);

    try {
      const target = hoverNode || selected;
      await put('/tree/node/bottom', new URLSearchParams({ uuid: target }));
      setReload(true);
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ??????
  const onMoveUp = async () => {
    setContextMenu(null);

    try {
      const target = hoverNode || selected;
      await put('/tree/node/up', new URLSearchParams({ uuid: target }));
      setReload(true);
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ??????
  const onMoveDown = async () => {
    setContextMenu(null);

    try {
      const target = hoverNode || selected;
      await put('/tree/node/down', new URLSearchParams({ uuid: target }));
      setReload(true);
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ????????????
  const onChangeName = async val => {
    try {
      await put('/tree/node/name', new URLSearchParams({
        uuid: node.uuid, name: val
      }));
      setNode({ ...node, name: val });
      setReload(true);
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ????????????
  const onChangeSummary = async val => {
    try {
      await put('/tree/node/summary', new URLSearchParams({
        uuid: node.uuid, summary: val
      }));
      setNode({ ...node, summary: val });
      enqueueSnackbar('????????????', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ???????????????
  const onAddClick = async () => {
    try {
      const resp = await post('/tree/node/add', new URLSearchParams({
        uuid: node.uuid,
      }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setReload(true);
      setExpanded([...expanded, node.uuid]);
      onNodeSelect(null, resp.uuid);
    } catch (err) {
      enqueueSnackbar(err.message);
    }
  }

  // ??????
  const onDisabledClick = async () => {
    try {
      await confirm({
        description: '?????????????????????????????????????????????????????????????????????????????????',
        confirmationText: '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await put('/tree/node/disable', new URLSearchParams({ uuid: node.uuid }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setReload(true);
      setNode({ ...node, disabled: true });
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ??????
  const onEnabledClick = async () => {
    try {
      await confirm({
        description: '?????????????????????????????????????????????????????????????????????????????????',
        confirmationText: '??????',
        confirmationButtonProps: { color: 'warning' },
        contentProps: { p: 8 },
      });
      await put('/tree/node/enable', new URLSearchParams({ uuid: node.uuid }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setReload(true);
      setNode({ ...node, disabled: false });
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ??????
  const onDeleteClick = async () => {
    try {
      await confirm({
        description: '?????????????????????????????????????????????????????????????????????????????????',
        confirmationText: '??????',
        confirmationButtonProps: { color: 'error' },
        contentProps: { p: 8 },
      });
      await put('/tree/node/delete', new URLSearchParams({ uuid: node.uuid }));
      enqueueSnackbar('????????????', { variant: 'success' });
      setSelected('');
      setPageData('selected', '');
      setReload(true);
    } catch (err) {
      if (err) {
        enqueueSnackbar(err.message);
      }
    }
  }

  // ???????????????
  const renderTree = node => (
    <StyledTreeItem key={node.uuid} nodeId={node.uuid}
      endIcon={
        node.disabled ?  <BlockIcon color='disabled' /> : <CommitIcon />
      }
      label={
        node.disabled ?
          <Typography sx={{ py: '4px' }} color='gray' variant='body2'
            onMouseEnter={() => { setHoverNode(node.uuid) }}>
            {node.name}
          </Typography>
          :
          <Typography sx={{ py: '4px' }} variant='body2'
            onMouseEnter={() => { setHoverNode(node.uuid) }}>
            {node.name}
          </Typography>
      }>
      {Array.isArray(node.children) ? node.children.map(n => renderTree(n)) : null}
    </StyledTreeItem>
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <Container as='main' role='main' sx={{ mb: 4, pt: 3 }}>
        <Splitter initialSizes={splitSizes} minWidths={[200, 400]}
          onResizeFinished={onSplitterResize}>
          <Stack onContextMenu={onNodeContextMenu}>
            {root &&
              <Button sx={{ alignSelf: 'flex-start' }} color='secondary'
                startIcon={<ReplayIcon />} onClick={onResetRootNode}>
                ???????????????
              </Button>
            }
            <TreeView
              aria-label="????????????"
              defaultExpanded={[]}
              defaultParentIcon={<AddIcon />}
              defaultCollapseIcon={<ArrowDropDownIcon />}
              defaultExpandIcon={<ArrowRightIcon />}
              expanded={expanded}
              selected={selected}
              onNodeToggle={onNodeToggle}
              onNodeSelect={onNodeSelect}
              sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {tree && renderTree(tree)}
            </TreeView>
            <Menu
              open={contextMenu !== null}
              onClose={() => setContextMenu(null)}
              anchorReference="anchorPosition"
              anchorPosition={
                contextMenu !== null
                  ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                  : undefined
              }>
              <MenuItem onClick={onSetRootNode}>?????????????????????</MenuItem>
              <MenuItem onClick={onExpandAll}>?????????????????????</MenuItem>
              <MenuItem onClick={onCollapseAll}>?????????????????????</MenuItem>
              <Divider />
              <MenuItem onClick={onMoveTop}>
                <ListItemIcon>
                  <VerticalAlignTopIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>????????????</ListItemText>
              </MenuItem>
              <MenuItem onClick={onMoveUp}>
                <ListItemIcon>
                  <ArrowUpwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>??????</ListItemText>
              </MenuItem>
              <MenuItem onClick={onMoveDown}>
                <ListItemIcon>
                  <ArrowDownwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>??????</ListItemText>
              </MenuItem>
              <MenuItem onClick={onMoveBottom}>
                <ListItemIcon>
                  <VerticalAlignBottomIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>????????????</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
          <Paper variant='outlined' sx={{ px: 3, py: 2 }}>
            <Stack direction='row' alignItems='center'>
              {nodeLoading ?
                <Typography variant="h6" sx={{ flex: 1 }}><Skeleton /></Typography>
                :
                <InplaceInput variant='h6' sx={{ flex: 1 }} fontSize='large'
                  text={node?.name || ''} onConfirm={onChangeName}
                  disabled={node.disabled}
                />
              }
              {!node.disabled && <Button onClick={onAddClick}>???????????????</Button>}
              {(!node.disabled && node.nlevel > 1) &&
                <ChangeParent name={node.name} uuid={node.uuid} tpath={node.tpath}
                  reload={setReload}
                />
              }
              {node.disabled ?
                <Button onClick={onEnabledClick} color='warning'>??????</Button>
                :
                <Button onClick={onDisabledClick} color='warning'>??????</Button>
              }
              <Button color='error' onClick={onDeleteClick}>??????</Button>
            </Stack>
            {nodeLoading ?
              <Typography variant="body2" sx={{ flex: 1 }}><Skeleton /></Typography>
              :
              <InplaceInput variant='body2' sx={{ flex: 1 }}
                text={node?.summary || ''} onConfirm={onChangeSummary}
                disabled={node.disabled}
              />
            }
            <Stack direction='row' alignItems='center' sx={{ mt: 1 }}>
              <Typography variant='caption' color='gray'>
                {nodeLoading ? <Skeleton /> : `??? ${node.nlevel || 0} ???`}
              </Typography>
              <IconButton aria-label='??????' sx={{ p: 0, color: '#8888', ml: 1 }}
                onClick={() => { setDetail(!detail) }}>
                {detail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
            <Collapse in={detail}>
              <Stack>
                <Typography variant='caption' color='gray'>
                  ????????????: {dayjs(node.create_at).format('YYYY???MM???DD??? HH:mm:ss')}
                </Typography>
                <Typography variant='caption' color='gray'>
                  ????????????: {dayjs(node.update_at).format('YYYY???MM???DD??? HH:mm:ss')}
                </Typography>
                {process.env.NODE_ENV === 'development' &&
                  <>
                    <Typography variant='caption' color='gray'>
                      ????????????: {node.sortno}
                    </Typography>
                    <Typography variant='caption' color='gray'>
                      {node.tpath}
                    </Typography>
                  </>
                }
              </Stack>
            </Collapse>
            <Paper variant='outlined' sx={{ p: 2, mt: 2 }}>
              <Stack direction='row' alignItems='center'>
                <Stack sx={{ flex: 1 }}>
                  <Typography variant='h6' disabled={node.disabled}>????????????</Typography>
                  <Typography variant='body2' disabled={node.disabled}>
                    ????????????????????????????????????(?????????????????????)????????????
                  </Typography>
                </Stack>
                <Button disabled={node.disabled} variant='contained' onClick={() => {
                  navigate('user', { state: { node }});
                }}>
                  ???????????????
                </Button>
              </Stack>
            </Paper>
          </Paper>
        </Splitter>
      </Container>
    </DndProvider>
  )
}
