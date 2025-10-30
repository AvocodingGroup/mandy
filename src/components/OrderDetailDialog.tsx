// Dialogové okno pre detail objednávky

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  updateOrderPriority,
  updateOrderItems,
  subscribeToComments,
  addComment,
  resolveComment,
  deleteComment,
  getPrices,
} from '@/lib/firestore';
import type { Order, OrderItem, Comment, ItemCustomizations, PriceSettings } from '@/types';
import { calculateOrderTotal } from '@/types';
import EditBurgerDialog from './EditBurgerDialog';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Checkbox,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddCircleIcon from '@mui/icons-material/AddCircle';

interface OrderDetailDialogProps {
  order: Order;
  onClose: () => void;
}

// Funkcia na formátovanie relatívneho času
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'práve teraz';
  if (diffMinutes === 1) return 'pred 1 minútou';
  if (diffMinutes < 5) return `pred ${diffMinutes} minútami`;
  if (diffMinutes < 60) return `pred ${diffMinutes} minútami`;
  if (diffHours === 1) return 'pred 1 hodinou';
  if (diffHours < 24) return `pred ${diffHours} hodinami`;
  if (diffDays === 1) return 'včera';
  if (diffDays < 7) return `pred ${diffDays} dňami`;
  
  // Pre staršie zobraz dátum
  return date.toLocaleDateString('sk-SK');
}

export default function OrderDetailDialog({
  order,
  onClose,
}: OrderDetailDialogProps) {
  const { user } = useAuth();
  const [priority, setPriority] = useState(order.priority);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showBurgerDialog, setShowBurgerDialog] = useState(false);
  const [showDeleteItemsDialog, setShowDeleteItemsDialog] = useState(false);
  const [burgerCustomizations, setBurgerCustomizations] = useState<ItemCustomizations>({
    removed: [],
    doubled: [],
  });
  const [prices, setPrices] = useState<PriceSettings>({ burgerPrice: 5, friesPrice: 2 });

  // Načítaj ceny
  useEffect(() => {
    const fetchPrices = async () => {
      const fetchedPrices = await getPrices();
      setPrices(fetchedPrices);
    };
    fetchPrices();
  }, []);

  // Real-time komentáre
  useEffect(() => {
    const unsubscribe = subscribeToComments(order.orderId, (updatedComments) => {
      setComments(updatedComments);
    });

    return () => unsubscribe();
  }, [order.orderId]);

  // Aktualizuj lokálny stav pri zmene objednávky
  useEffect(() => {
    setItems(order.items);
  }, [order.items]);

  const handlePriorityChange = async (delta: number) => {
    const newPriority = Math.max(1, priority + delta);
    setPriority(newPriority);
    await updateOrderPriority(order.orderId, newPriority);
  };

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.itemId)));
    }
  };

  const handleTogglePaid = async () => {
    if (selectedItems.size === 0) return;

    const updatedItems = items.map((item) => {
      if (selectedItems.has(item.itemId)) {
        return { ...item, isPaid: !item.isPaid };
      }
      return item;
    });

    setItems(updatedItems);
    await updateOrderItems(order.orderId, updatedItems);
  };

  const handleToggleDelivered = async () => {
    if (selectedItems.size === 0) return;

    const updatedItems = items.map((item) => {
      if (selectedItems.has(item.itemId)) {
        return { ...item, isDelivered: !item.isDelivered };
      }
      return item;
    });

    setItems(updatedItems);
    await updateOrderItems(order.orderId, updatedItems);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    await addComment(order.orderId, newComment.trim(), user.userId, user.nickname);
    setNewComment('');
  };

  const handleResolveComment = async (commentId: string) => {
    await resolveComment(order.orderId, commentId);
    setSelectedComment(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(order.orderId, commentId);
    setSelectedComment(null);
  };

  const handleCompleteOrder = async () => {
    // Označ všetky položky ako zaplatené a odovzdané
    const completedItems = items.map(item => ({
      ...item,
      isPaid: true,
      isDelivered: true,
    }));

    setItems(completedItems);
    await updateOrderItems(order.orderId, completedItems);
    setShowCompleteDialog(false);
  };

  const handleAddBurger = (customizations: ItemCustomizations) => {
    const burgerItem: OrderItem = {
      itemId: `item-${Date.now()}-${Math.random()}`,
      type: 'burger',
      customizations,
      isPaid: false,
      isDelivered: false,
    };

    const newItems = [...items, burgerItem];
    setItems(newItems);
    updateOrderItems(order.orderId, newItems);
    setShowBurgerDialog(false);
    setBurgerCustomizations({ removed: [], doubled: [] });
  };

  const handleAddFries = () => {
    const friesItem: OrderItem = {
      itemId: `item-${Date.now()}-${Math.random()}`,
      type: 'fries',
      customizations: { removed: [], doubled: [] },
      isPaid: false,
      isDelivered: false,
    };

    const newItems = [...items, friesItem];
    setItems(newItems);
    updateOrderItems(order.orderId, newItems);
  };

  const handleDeleteSelectedItems = () => {
    if (selectedItems.size === 0) return;
    setShowDeleteItemsDialog(true);
  };

  const confirmDeleteItems = async () => {
    const newItems = items.filter((item) => !selectedItems.has(item.itemId));
    setItems(newItems);
    setSelectedItems(new Set());
    await updateOrderItems(order.orderId, newItems);
    setShowDeleteItemsDialog(false);
  };

  const getItemDescription = (item: OrderItem) => {
    if (item.type === 'fries') return 'Hranolky';
    return 'Burger';
  };

  const getItemChips = (item: OrderItem) => {
    const chips: React.ReactNode[] = [];

    if (item.type === 'fries') return chips;

    const { removed, doubled } = item.customizations;

    // Zobraz chipy len pre upravené ingrediencie
    removed.forEach((ing) => {
      chips.push(
        <Chip key={`removed-${ing}`} label={`0x ${ing}`} size="small" color="error" />
      );
    });

    doubled.forEach((ing) => {
      chips.push(
        <Chip key={`doubled-${ing}`} label={`2x ${ing}`} size="small" color="success" />
      );
    });

    return chips;
  };

  return (
    <>
      <Dialog open={true} onClose={onClose} fullScreen sx={{ '& .MuiDialog-paper': { borderRadius: 0 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              Objednávka #{order.orderNumber}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Priorita a Ceny */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                Priorita:
              </Typography>
              <IconButton onClick={() => handlePriorityChange(-1)} size="small" color="primary">
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="bold">
                {priority}
              </Typography>
              <IconButton onClick={() => handlePriorityChange(1)} size="small" color="primary">
                <AddIcon />
              </IconButton>
            </Stack>

            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body1" fontWeight="bold">
                  Celková cena:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {calculateOrderTotal(items, prices).toFixed(2)} €
                </Typography>
              </Stack>

              {selectedItems.size > 0 && (
                <>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Označené ({selectedItems.size}):
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="info.main">
                      {calculateOrderTotal(
                        items.filter(item => selectedItems.has(item.itemId)),
                        prices
                      ).toFixed(2)} €
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Zostáva zaplatiť:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {(
                        calculateOrderTotal(items, prices) -
                        calculateOrderTotal(
                          items.filter(item => item.isPaid),
                          prices
                        )
                      ).toFixed(2)} €
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Položky */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Položky:
              </Typography>
              <Button onClick={toggleSelectAll} size="small">
                {selectedItems.size === items.length ? 'Zrušiť výber' : 'Vybrať všetky'}
              </Button>
            </Box>

            <List>
              {items.map((item) => (
                <ListItem
                  key={item.itemId}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                    py: 1,
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {item.isPaid && (
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      )}
                      {item.isDelivered && (
                        <IconButton size="small" sx={{ color: 'secondary.main' }}>
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Checkbox
                        checked={selectedItems.has(item.itemId)}
                        onChange={() => toggleSelectItem(item.itemId)}
                        size="small"
                      />
                    </Box>
                  }
                >
                  <Box>
                    <Typography variant="body2" fontWeight="500">{getItemDescription(item)}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {getItemChips(item)}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Button
                onClick={handleTogglePaid}
                disabled={selectedItems.size === 0}
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PaymentIcon />}
              >
                Zaplatené
              </Button>
              <Button
                onClick={handleToggleDelivered}
                disabled={selectedItems.size === 0}
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<LocalShippingIcon />}
              >
                Odovzdané
              </Button>
              <Button
                onClick={handleDeleteSelectedItems}
                disabled={selectedItems.size === 0}
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
              >
                Vymazať
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Pridať položky */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Pridať položky:
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={() => setShowBurgerDialog(true)}
                  variant="outlined"
                  size="small"
                  startIcon={<AddCircleIcon />}
                >
                  Burger
                </Button>
                <Button
                  onClick={handleAddFries}
                  variant="outlined"
                  size="small"
                  startIcon={<AddCircleIcon />}
                >
                  Hranolky
                </Button>
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Komentáre */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Komentáre:
              </Typography>
              {comments.filter(c => !c.isResolved).length > 0 && (
                <Chip
                  label={`${comments.filter(c => !c.isResolved).length} nevyriešených`}
                  size="small"
                  color="error"
                />
              )}
              {comments.filter(c => c.isResolved).length > 0 && (
                <Chip
                  label={`${comments.filter(c => c.isResolved).length} vyriešených`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>

            <Box sx={{ mb: 2 }}>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Žiadne komentáre
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {comments.map((comment) => {
                    const isOwnComment = comment.authorId === user?.userId;
                    return (
                      <Box
                        key={comment.commentId}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          onClick={() => setSelectedComment(comment)}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            bgcolor: comment.isResolved
                              ? (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.400'
                              : (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                            color: (theme) => comment.isResolved
                              ? 'white'
                              : theme.palette.text.primary,
                            maxWidth: '70%',
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={1}>
                            <Box sx={{ flex: 1 }}>
                              {!isOwnComment && (
                                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                                  {comment.authorNickname}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.primary">{comment.text}</Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  opacity: 0.8,
                                }}
                              >
                                {getTimeAgo(comment.createdAt.toDate())}
                              </Typography>
                            </Box>
                            {comment.isResolved && (
                              <CheckCircleIcon 
                                sx={{ 
                                  color: 'success.main',
                                  fontSize: 20,
                                  flexShrink: 0,
                                }} 
                              />
                            )}
                          </Stack>
                        </Paper>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Napíšte komentár..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
              />
              <Button onClick={handleAddComment} variant="contained" color="primary">
                Pridať
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" fullWidth>
            Zavrieť
          </Button>
          <Button
            onClick={() => setShowCompleteDialog(true)}
            variant="contained"
            color="success"
            fullWidth
          >
            Označiť ako vybavené
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre potvrdenie dokončenia */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>Označiť objednávku ako vybavené?</DialogTitle>
        <DialogContent>
          <Typography>
            Všetky položky v objednávke budú označené ako zaplatené a odovzdané.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)} color="inherit">
            Zrušiť
          </Button>
          <Button onClick={handleCompleteOrder} variant="contained" color="success">
            Potvrdiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre potvrdenie vymazania položiek */}
      <Dialog open={showDeleteItemsDialog} onClose={() => setShowDeleteItemsDialog(false)}>
        <DialogTitle>Vymazať položky?</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať {selectedItems.size} {selectedItems.size === 1 ? 'položku' : selectedItems.size < 5 ? 'položky' : 'položiek'} z objednávky?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteItemsDialog(false)} color="inherit">
            Zrušiť
          </Button>
          <Button onClick={confirmDeleteItems} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre úpravu burgra */}
      {showBurgerDialog && (
        <EditBurgerDialog
          initialCustomizations={burgerCustomizations}
          onConfirm={handleAddBurger}
          onCancel={() => setShowBurgerDialog(false)}
        />
      )}

      {/* Dialog pre akcie s komentárom */}
      {selectedComment && (
        <Dialog open={true} onClose={() => setSelectedComment(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Akcie s komentárom</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedComment.text}
            </Typography>
            <Stack spacing={1}>
              {!selectedComment.isResolved && (
                <Button
                  onClick={() => handleResolveComment(selectedComment.commentId)}
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  fullWidth
                >
                  Vyriešiť
                </Button>
              )}
              {selectedComment.authorId === user?.userId && (
                <Button
                  onClick={() => handleDeleteComment(selectedComment.commentId)}
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  fullWidth
                >
                  Vymazať
                </Button>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedComment(null)} color="inherit">
              Zrušiť
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
