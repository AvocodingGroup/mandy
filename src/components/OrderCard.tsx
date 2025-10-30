// Komponent pre zobrazenie karty objednávky

'use client';

import { useEffect, useState, useRef } from 'react';
import type { Order, Comment } from '@/types';
import { Box, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import Image from 'next/image';
import { subscribeToComments } from '@/lib/firestore';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onDelete: (orderId: string) => void;
}

export default function OrderCard({ order, onClick, onDelete }: OrderCardProps) {
  const [elapsedTime, setElapsedTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [unresolvedCommentsCount, setUnresolvedCommentsCount] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Vypočítaj stavy
  const deliveredCount = order.items.filter((item) => item.isDelivered).length;
  const paidCount = order.items.filter((item) => item.isPaid).length;
  const totalCount = order.items.length;
  const burgerCount = order.items.filter((item) => item.type === 'burger').length;
  const friesCount = order.items.filter((item) => item.type === 'fries').length;

  const isAllDelivered = deliveredCount === totalCount;
  const isAllPaid = paidCount === totalCount;
  const isCompleted = isAllDelivered && isAllPaid;

  // Progres pre indikátory (0-100%)
  const deliveredProgress = totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0;
  const paidProgress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to comments for unresolved count
  useEffect(() => {
    const unsubscribe = subscribeToComments(order.orderId, (comments: Comment[]) => {
      const unresolvedCount = comments.filter((c) => !c.isResolved).length;
      setUnresolvedCommentsCount(unresolvedCount);
    });

    return () => unsubscribe();
  }, [order.orderId]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Povoľ swipe len doľava (záporné hodnoty)
    if (diff < 0) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Ak je swipe viac ako 80px, zobraz delete tlačidlo
    if (swipeOffset < -80) {
      setSwipeOffset(-80);
    } else {
      // Vráť kartu na pôvodnú pozíciu
      setSwipeOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;

    // Povoľ swipe len doľava (záporné hodnoty)
    if (diff < 0) {
      setSwipeOffset(diff);
    }
  };

  const handleMouseUp = () => {
    setIsSwiping(false);

    // Ak je swipe viac ako 80px, zobraz delete tlačidlo
    if (swipeOffset < -80) {
      setSwipeOffset(-80);
    } else {
      // Vráť kartu na pôvodnú pozíciu
      setSwipeOffset(0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(order.orderId);
  };

  const handleCardClick = () => {
    // Kliknutie funguje len ak nie je swipnuté
    if (swipeOffset === 0) {
      onClick();
    }
  };

  // Časovač - zastaví sa keď je objednávka dokončená
  useEffect(() => {
    // Ak je objednávka dokončená, zobraz konečný čas z completedAt
    if (isCompleted && order.completedAt) {
      const completed = order.completedAt.toDate();
      const created = order.createdAt.toDate();
      const diff = Math.floor((completed.getTime() - created.getTime()) / 1000);

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      return; // Nevytváraj interval
    }

    // Pre nedokončené objednávky aktualizuj každú sekundu
    const updateTimer = () => {
      const now = new Date();
      const created = order.createdAt.toDate();
      const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt, order.completedAt, isCompleted]);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mb: 2,
        borderRadius: '12px',
      }}
    >
      {/* Delete tlačidlo na pozadí */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '80px',
          bgcolor: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
          borderRadius: '12px',
        }}
      >
        <IconButton
          onClick={handleDelete}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'error.dark',
            },
          }}
        >
          <DeleteIcon fontSize="large" />
        </IconButton>
      </Box>

      {/* Karta objednávky */}
      <Box
        ref={cardRef}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{
          cursor: 'pointer',
          transition: isSwiping ? 'none' : 'transform 0.3s ease, box-shadow 0.3s',
          transform: `translateX(${swipeOffset}px)`,
          position: 'relative',
          zIndex: 1,
          bgcolor: '#000000',
          borderRadius: '12px',
          boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
          height: '70px',
          width: '372px',
          maxWidth: '100%',
          padding: '13px 21px',
          '&:hover': {
            boxShadow: '0px 6px 12px 0px rgba(0,0,0,0.35)',
          },
        }}
      >
        {/* Order Number */}
        <Box
          sx={{
            position: 'absolute',
            left: '21px',
            top: '13px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '24px',
            color: '#FFFFFF',
            lineHeight: 'normal',
          }}
        >
          {order.orderNumber}#
        </Box>

        {/* Created Time with Clock Icon */}
        <Box
          sx={{
            position: 'absolute',
            left: '21px',
            top: '46px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Image
            src="/assets/clock-icon.png"
            alt="clock"
            width={12}
            height={12}
            style={{ objectFit: 'contain' }}
          />
          <Box
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              color: '#FFFFFF',
            }}
          >
            {order.createdAt.toDate().toLocaleTimeString('sk-SK', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Box>
        </Box>

        {/* Delivered Indicator */}
        <Box
          sx={{
            position: 'absolute',
            left: '86px',
            top: '16px',
            width: '74px',
            height: '14px',
          }}
        >
          {/* Background */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              bgcolor: '#BEE0C3',
              borderRadius: '3px',
            }}
          />
          {/* Progress bar */}
          <Box
            sx={{
              position: 'absolute',
              width: `${deliveredProgress}%`,
              height: '100%',
              bgcolor: '#0EAF26',
              borderRadius: '3px',
              border: '0px 1px 0px 0px solid #086916',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        {/* Paid Indicator */}
        <Box
          sx={{
            position: 'absolute',
            left: '174px',
            top: '16px',
            width: '74px',
            height: '14px',
          }}
        >
          {/* Background */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              bgcolor: '#CFCAFD',
              borderRadius: '3px',
            }}
          />
          {/* Progress bar */}
          <Box
            sx={{
              position: 'absolute',
              width: `${paidProgress}%`,
              height: '100%',
              bgcolor: '#4E3CDB',
              borderRadius: '3px',
              border: '0px 1px 0px 0px solid #2A1C96',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        {/* Burger Counter */}
        <Box
          sx={{
            position: 'absolute',
            left: '121px',
            top: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            height: '19px',
          }}
        >
          <Image
            src="/assets/burger-icon.png"
            alt="burger"
            width={19}
            height={19}
            style={{ objectFit: 'contain' }}
          />
          <Box
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              color: '#FFFFFF',
            }}
          >
            {burgerCount}
          </Box>
        </Box>

        {/* Fries Counter (with background) */}
        <Box
          sx={{
            position: 'absolute',
            left: '179px',
            top: '42px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '22px',
            bgcolor: '#FCA119',
            borderRadius: '4px',
            padding: '2px',
          }}
        >
          <Image
            src="/assets/fries-icon.png"
            alt="fries"
            width={19}
            height={19}
            style={{ objectFit: 'contain' }}
          />
          <Box
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              color: '#000000',
              paddingRight: '4px',
            }}
          >
            {friesCount}
          </Box>
        </Box>

        {/* Elapsed Time (Timer) */}
        <Box
          sx={{
            position: 'absolute',
            left: '285px',
            top: '13px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '24px',
            color: '#FCA119',
          }}
        >
          {elapsedTime}
        </Box>

        {/* Unresolved Comments Indicator */}
        {unresolvedCommentsCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              right: '14px',
              top: '43px',
            }}
          >
            <Chip
              icon={<CommentIcon sx={{ fontSize: 12 }} />}
              label={unresolvedCommentsCount}
              size="small"
              color="error"
              sx={{
                height: '18px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
