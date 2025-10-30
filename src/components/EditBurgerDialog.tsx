// Dialog pre úpravu burgra s 3-stavovými tlačidlami pre ingrediencie

'use client';

import { useState, useEffect } from 'react';
import { getActiveRecipe } from '@/lib/firestore';
import type { ItemCustomizations } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface EditBurgerDialogProps {
  initialCustomizations: ItemCustomizations;
  onConfirm: (customizations: ItemCustomizations) => void;
  onCancel: () => void;
}

type IngredientState = 0 | 1 | 2; // 0x (removed), 1x (normal), 2x (doubled)

export default function EditBurgerDialog({
  initialCustomizations,
  onConfirm,
  onCancel,
}: EditBurgerDialogProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientStates, setIngredientStates] = useState<Map<string, IngredientState>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  // Načítaj ingrediencie z aktívneho receptu
  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      const activeRecipe = await getActiveRecipe();
      if (activeRecipe) {
        setIngredients(activeRecipe.ingredients);

        // Nastav počiatočné stavy
        const states = new Map<string, IngredientState>();
        activeRecipe.ingredients.forEach((ing) => {
          if (initialCustomizations.removed.includes(ing)) {
            states.set(ing, 0);
          } else if (initialCustomizations.doubled.includes(ing)) {
            states.set(ing, 2);
          } else {
            states.set(ing, 1);
          }
        });
        setIngredientStates(states);
      }
      setLoading(false);
    };

    fetchIngredients();
  }, [initialCustomizations]);

  const cycleIngredient = (ingredient: string) => {
    const currentState: IngredientState = ingredientStates.get(ingredient) ?? 1;
    let nextState: IngredientState;

    if (currentState === 1) {
      nextState = 0; // 1x → 0x
    } else if (currentState === 0) {
      nextState = 2; // 0x → 2x
    } else {
      nextState = 1; // 2x → 1x
    }

    const newStates = new Map(ingredientStates);
    newStates.set(ingredient, nextState);
    setIngredientStates(newStates);
  };

  const getButtonColor = (ingredient: string): 'error' | 'success' | 'inherit' => {
    const state: IngredientState = ingredientStates.get(ingredient) ?? 1;

    if (state === 0) {
      return 'error'; // červená
    } else if (state === 2) {
      return 'success'; // zelená
    } else {
      return 'inherit'; // sivá
    }
  };

  const getButtonLabel = (ingredient: string) => {
    const state: IngredientState = ingredientStates.get(ingredient) ?? 1;

    if (state === 0) {
      return `0x ${ingredient}`;
    } else if (state === 2) {
      return `2x ${ingredient}`;
    } else {
      return `1x ${ingredient}`;
    }
  };

  const handleConfirm = () => {
    const removed: string[] = [];
    const doubled: string[] = [];

    ingredientStates.forEach((state, ingredient) => {
      if (state === 0) removed.push(ingredient);
      if (state === 2) doubled.push(ingredient);
    });

    onConfirm({ removed, doubled });
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Upraviť burger
          </Typography>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : ingredients.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            Žiadny aktívny recept. Prejdite do nastavení a vytvorte recept.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Kliknite na ingredienciu pre zmenu stavu:
              <br />
              <Box component="span" sx={{ color: 'error.main' }}>Červená = 0x (odobraná)</Box>
              <br />
              <Box component="span" sx={{ color: 'success.main' }}>Zelená = 2x (zdvojená)</Box>
              <br />
              Sivá = 1x (normálne)
            </Typography>

            <Stack spacing={1}>
              {ingredients.map((ingredient) => (
                <Button
                  key={ingredient}
                  onClick={() => cycleIngredient(ingredient)}
                  variant="contained"
                  color={getButtonColor(ingredient)}
                  fullWidth
                  size="large"
                >
                  {getButtonLabel(ingredient)}
                </Button>
              ))}
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Zrušiť
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Potvrdiť
        </Button>
      </DialogActions>
    </Dialog>
  );
}
