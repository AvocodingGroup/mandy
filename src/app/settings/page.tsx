// Obrazovka nastavení - správa ingrediencií, receptov a nickname

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import {
  getIngredients,
  addIngredient,
  deleteIngredient,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  setActiveRecipe,
  updateNickname,
  getPrices,
  updatePrices,
  getOrderCounter,
  setOrderCounter,
} from '@/lib/firestore';
import type { Recipe, PriceSettings } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { darkMode } = useThemeMode();
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    selectedIngredients: new Set<string>(),
  });
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [prices, setPrices] = useState<PriceSettings>({ burgerPrice: 5, friesPrice: 2 });
  const [orderCounter, setOrderCounterState] = useState<number>(0);
  const [newCounterValue, setNewCounterValue] = useState<string>('');

  // Presmerovanie ak nie je prihlásený
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Načítaj nastavenia
  useEffect(() => {
    const fetchSettings = async () => {
      const [fetchedIngredients, fetchedRecipes, fetchedPrices, fetchedCounter] = await Promise.all([
        getIngredients(),
        getRecipes(),
        getPrices(),
        getOrderCounter(),
      ]);
      setIngredients(fetchedIngredients);
      setRecipes(fetchedRecipes);
      setPrices(fetchedPrices);
      setOrderCounterState(fetchedCounter);
      setNewCounterValue(fetchedCounter.toString());
    };

    if (user) {
      fetchSettings();
      setNewNickname(user.nickname);
    }
  }, [user]);

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;

    try {
      await addIngredient(newIngredient.trim());
      const updated = await getIngredients();
      setIngredients(updated);
      setNewIngredient('');
    } catch (error) {
      console.error('Chyba pri pridávaní ingrediencie:', error);
      setErrorMessage('Chyba pri pridávaní ingrediencie');
    }
  };

  const handleDeleteIngredient = (ingredient: string) => {
    setIngredientToDelete(ingredient);
  };

  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete) return;

    try {
      await deleteIngredient(ingredientToDelete);
      const updated = await getIngredients();
      setIngredients(updated);
      setIngredientToDelete(null);
    } catch (error) {
      console.error('Chyba pri mazaní ingrediencie:', error);
      setErrorMessage('Chyba pri mazaní ingrediencie');
      setIngredientToDelete(null);
    }
  };

  const handleCreateRecipe = () => {
    setShowCreateRecipe(true);
    setRecipeForm({
      name: '',
      selectedIngredients: new Set(),
    });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      selectedIngredients: new Set(recipe.ingredients),
    });
  };

  const toggleIngredientInRecipe = (ingredient: string) => {
    const newSelected = new Set(recipeForm.selectedIngredients);
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient);
    } else {
      newSelected.add(ingredient);
    }
    setRecipeForm({ ...recipeForm, selectedIngredients: newSelected });
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.name.trim()) {
      setValidationMessage('Zadajte názov receptu');
      return;
    }

    if (recipeForm.selectedIngredients.size === 0) {
      setValidationMessage('Vyberte aspoň jednu ingredienciu');
      return;
    }

    const selectedIngs = Array.from(recipeForm.selectedIngredients);

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipeForm.name.trim(), selectedIngs);
      } else {
        await createRecipe(recipeForm.name.trim(), selectedIngs);
      }

      const updated = await getRecipes();
      setRecipes(updated);
      setShowCreateRecipe(false);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Chyba pri ukladaní receptu:', error);
      setErrorMessage('Chyba pri ukladaní receptu');
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipeToDelete(recipeId);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return;

    try {
      await deleteRecipe(recipeToDelete);
      const updated = await getRecipes();
      setRecipes(updated);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Chyba pri mazaní receptu:', error);
      setErrorMessage('Chyba pri mazaní receptu');
      setRecipeToDelete(null);
    }
  };

  const handleSetActiveRecipe = async (recipeId: string) => {
    try {
      await setActiveRecipe(recipeId);
      const updated = await getRecipes();
      setRecipes(updated);
    } catch (error) {
      console.error('Chyba pri nastavení aktívneho receptu:', error);
      setErrorMessage('Chyba pri nastavení aktívneho receptu');
    }
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim() || !user) return;

    if (newNickname.trim() === user.nickname) {
      setValidationMessage('Nový nickname je rovnaký ako aktuálny');
      return;
    }

    try {
      await updateNickname(user.userId, newNickname.trim());
      setSuccessMessage('Nickname bol úspešne zmenený. Odhláste sa a prihláste znova.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Chyba pri zmene nickname');
    }
  };

  const handleUpdatePrices = async () => {
    if (prices.burgerPrice <= 0 || prices.friesPrice <= 0) {
      setValidationMessage('Ceny musia byť väčšie ako 0');
      return;
    }

    try {
      await updatePrices(prices);
      setSuccessMessage('Ceny boli úspešne aktualizované');
    } catch (error) {
      console.error('Chyba pri aktualizácii cien:', error);
      setErrorMessage('Chyba pri aktualizácii cien');
    }
  };

  const handleUpdateOrderCounter = async () => {
    const counterValue = parseInt(newCounterValue);
    if (isNaN(counterValue) || counterValue < 0) {
      setValidationMessage('Číslo countera musí byť nezáporné číslo');
      return;
    }

    try {
      await setOrderCounter(counterValue);
      setOrderCounterState(counterValue);
      setSuccessMessage('Counter objednávok bol úspešne aktualizovaný');
    } catch (error) {
      console.error('Chyba pri aktualizácii countera:', error);
      setErrorMessage('Chyba pri aktualizácii countera objednávok');
    }
  };

  if (loading || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Navigation />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Hlavička */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Nastavenia</h1>
        </div>

        {/* Ingrediencie */}
        <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Ingrediencie</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Názov ingrediencie"
              className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddIngredient();
              }}
            />
            <button
              onClick={handleAddIngredient}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Pridať
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Žiadne ingrediencie</p>
            ) : (
              ingredients.map((ingredient) => (
                <div
                  key={ingredient}
                  className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{ingredient}</span>
                  <button
                    onClick={() => handleDeleteIngredient(ingredient)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Vymazať
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recepty */}
        <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Recepty</h2>
            <button
              onClick={handleCreateRecipe}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Vytvoriť nový recept
            </button>
          </div>

          <div className="space-y-3">
            {recipes.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Žiadne recepty</p>
            ) : (
              recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`p-4 rounded-lg border-2 ${
                    recipe.isActive
                      ? `border-green-500 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`
                      : `${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {recipe.name}
                        {recipe.isActive && (
                          <span className={`ml-2 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓ Aktívny</span>
                        )}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {recipe.ingredients.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!recipe.isActive && (
                        <button
                          onClick={() => handleSetActiveRecipe(recipe.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Aktivovať
                        </button>
                      )}
                      <button
                        onClick={() => handleEditRecipe(recipe)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Upraviť
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Vymazať
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ceny */}
        <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Ceny položiek</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cena burgra (€)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={prices.burgerPrice}
                  onChange={(e) => setPrices({ ...prices, burgerPrice: parseFloat(e.target.value) || 0 })}
                  className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cena hranolkov (€)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={prices.friesPrice}
                  onChange={(e) => setPrices({ ...prices, friesPrice: parseFloat(e.target.value) || 0 })}
                  className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
            <button
              onClick={handleUpdatePrices}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Uložiť ceny
            </button>
          </div>
        </div>

        {/* Counter objednávok */}
        <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Číslo objednávky</h2>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Aktuálne číslo: <strong>{orderCounter}</strong> (ďalšia objednávka bude: {orderCounter + 1})
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={newCounterValue}
              onChange={(e) => setNewCounterValue(e.target.value)}
              placeholder="Nové číslo countera"
              className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <button
              onClick={handleUpdateOrderCounter}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Nastaviť
            </button>
          </div>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Zmeňte číslo countera ak chcete, aby ďalšia objednávka mala konkrétne číslo.
          </p>
        </div>

        {/* Zmena nickname */}
        <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Zmena nickname</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Nový nickname"
              className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <button
              onClick={handleUpdateNickname}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Uložiť
            </button>
          </div>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Po zmene nickname sa odhláste a prihláste znova.
          </p>
        </div>
      </div>

      {/* Dialog pre vytvorenie/úpravu receptu */}
      {(showCreateRecipe || editingRecipe) && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowCreateRecipe(false);
              setEditingRecipe(null);
            }}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-100 p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {editingRecipe ? 'Upraviť recept' : 'Vytvoriť recept'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateRecipe(false);
                      setEditingRecipe(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Názov receptu
                  </label>
                  <input
                    type="text"
                    value={recipeForm.name}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, name: e.target.value })
                    }
                    placeholder="Napr. Klasický burger"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                  />
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ingrediencie
                  </label>
                  {ingredients.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Najprv pridajte ingrediencie v sekcii vyššie
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {ingredients.map((ingredient) => (
                        <label
                          key={ingredient}
                          className={`flex items-center gap-2 cursor-pointer p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={recipeForm.selectedIngredients.has(ingredient)}
                            onChange={() => toggleIngredientInRecipe(ingredient)}
                            className="w-5 h-5"
                          />
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{ingredient}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveRecipe}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                >
                  {editingRecipe ? 'Uložiť zmeny' : 'Vytvoriť recept'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dialog pre potvrdenie vymazania ingrediencie */}
      <Dialog open={ingredientToDelete !== null} onClose={() => setIngredientToDelete(null)}>
        <DialogTitle>Vymazať ingredienciu?</DialogTitle>
        <DialogContent>
          <p className="text-gray-800">
            Naozaj chcete vymazať ingredienciu "{ingredientToDelete}"?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIngredientToDelete(null)} color="inherit">
            Zrušiť
          </Button>
          <Button onClick={confirmDeleteIngredient} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre potvrdenie vymazania receptu */}
      <Dialog open={recipeToDelete !== null} onClose={() => setRecipeToDelete(null)}>
        <DialogTitle>Vymazať recept?</DialogTitle>
        <DialogContent>
          <p className="text-gray-800">
            Naozaj chcete vymazať tento recept?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipeToDelete(null)} color="inherit">
            Zrušiť
          </Button>
          <Button onClick={confirmDeleteRecipe} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pre chybové hlásenia */}
      <Snackbar
        open={errorMessage !== ''}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Snackbar pre úspešné hlásenia */}
      <Snackbar
        open={successMessage !== ''}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Snackbar pre validačné hlásenia */}
      <Snackbar
        open={validationMessage !== ''}
        autoHideDuration={4000}
        onClose={() => setValidationMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setValidationMessage('')} severity="warning" sx={{ width: '100%' }}>
          {validationMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
