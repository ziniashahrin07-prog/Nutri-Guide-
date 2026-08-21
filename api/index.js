// src/server/app.ts
import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

// src/data/foodMetadata.ts
var FOOD_METADATA_MAP = {
  // --- 1. Rice & Grains ---
  "grain-01": {
    mealRoles: ["staple_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_main", "rice_grain"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "grain-02": {
    mealRoles: ["staple_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_main", "rice_grain"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "grain-03": {
    mealRoles: ["staple_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_main", "rice_grain"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "grain-04": {
    mealRoles: ["staple_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_main", "rice_grain"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "grain-05": {
    mealRoles: ["breakfast_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["bengali_breakfast", "snack", "light_grain"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "grain-06": {
    mealRoles: ["breakfast_grain"],
    primaryRole: "snack",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["bengali_breakfast", "snack", "light_grain"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "grain-07": {
    mealRoles: ["breakfast_cereal"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["cereal_porridge", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "leafy_shak_dish", "heavy_curry", "vegetable_curry_dish"]
  },
  "grain-08": {
    mealRoles: ["breakfast_bread", "staple_grain"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_breakfast", "bengali_main", "flatbread"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "grain-09": {
    mealRoles: ["breakfast_bread"],
    primaryRole: "staple",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_breakfast", "bengali_main", "flatbread"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert", "shutki_curry"]
  },
  // --- 2. Dal & Legumes ---
  "dal-01": {
    mealRoles: ["plant_protein_dal"],
    primaryRole: "dal",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["dal_curry", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "dal-02": {
    mealRoles: ["plant_protein_dal"],
    primaryRole: "dal",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["dal_curry", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "dal-03": {
    mealRoles: ["plant_protein_legume"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["legume_dish", "bengali_main", "snack"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "dal-04": {
    mealRoles: ["plant_protein_dal"],
    primaryRole: "dal",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["dal_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "dal-05": {
    mealRoles: ["plant_protein_legume"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["legume_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "dal-06": {
    mealRoles: ["plant_protein_dal"],
    primaryRole: "dal",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["dal_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  // --- 3. Fish ---
  "fish-01": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-02": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-03": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-04": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-05": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-06": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-07": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-08": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-09": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-10": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "fish-11": {
    mealRoles: ["animal_protein_shutki"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["shutki_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "dairy_curd", "fruit_dessert", "snack", "bengali_breakfast"]
  },
  "fish-13": {
    mealRoles: ["animal_protein_fish"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["fish_curry", "bengali_main", "light_jhol"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  // --- 4. Poultry & Meat ---
  "poultry-01": {
    mealRoles: ["animal_protein_poultry"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["meat_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "meat-01": {
    mealRoles: ["animal_protein_meat"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["meat_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  "meat-02": {
    mealRoles: ["animal_protein_meat"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: false,
    // Heavy red meat deprioritized for dinner
    snackSuitable: false,
    combinationGroups: ["meat_curry", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert", "snack"]
  },
  // --- 5. Eggs ---
  "egg-01": {
    mealRoles: ["egg_protein"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["egg_dish", "bengali_main", "bengali_breakfast", "snack"],
    incompatibleGroups: ["cereal_porridge"]
  },
  // --- 6. Vegetables ---
  "veg-01": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-02": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-03": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-04": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-05": {
    mealRoles: ["vegetable_curry", "vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-06": {
    mealRoles: ["vegetable_curry", "vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-07": {
    mealRoles: ["vegetable_curry", "vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-08": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-09": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-10": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-11": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-12": {
    mealRoles: ["vegetable_curry", "vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-13": {
    mealRoles: ["vegetable_curry", "fresh_salad"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["vegetable_dish", "salad_dish", "bengali_main"],
    incompatibleGroups: []
  },
  "veg-14": {
    mealRoles: ["fresh_salad"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["salad_dish", "snack", "bengali_main"],
    incompatibleGroups: []
  },
  "veg-15": {
    mealRoles: ["fresh_salad", "vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["salad_dish", "vegetable_dish", "bengali_main"],
    incompatibleGroups: []
  },
  "veg-16": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-17": {
    mealRoles: ["vegetable_curry", "vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-18": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-19": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-20": {
    mealRoles: ["vegetable_bhaji", "vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "vegetable_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-21": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-22": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-23": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-24": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-25": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-26": {
    mealRoles: ["vegetable_bhaji", "vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-27": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "veg-28": {
    mealRoles: ["fresh_salad"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["salad_dish", "vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: []
  },
  "veg-29": {
    mealRoles: ["fresh_salad"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["salad_dish", "vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: []
  },
  "veg-30": {
    mealRoles: ["vegetable_bhaji", "vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_bhaji_dish", "bengali_breakfast", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  // --- 7. Leafy Vegetables ---
  "leafy-01": {
    mealRoles: ["leafy_shak"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["leafy_shak_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert"]
  },
  "leafy-02": {
    mealRoles: ["leafy_shak"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["leafy_shak_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert"]
  },
  "leafy-03": {
    mealRoles: ["leafy_shak"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["leafy_shak_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert"]
  },
  "leafy-04": {
    mealRoles: ["leafy_shak"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["leafy_shak_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert"]
  },
  "leafy-05": {
    mealRoles: ["leafy_shak"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["leafy_shak_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge", "dairy_milk", "fruit_dessert"]
  },
  // --- 8. Fruits ---
  "fruit-01": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-02": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-03": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-04": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-05": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-06": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry", "dairy_milk"]
  },
  "fruit-07": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-08": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry", "dairy_milk"]
  },
  "fruit-09": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry", "dairy_milk"]
  },
  "fruit-10": {
    mealRoles: ["whole_fruit"],
    primaryRole: "snack",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "fruit-11": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-12": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-13": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_snack", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "fruit-14": {
    mealRoles: ["whole_fruit"],
    primaryRole: "fruit",
    isProteinSource: false,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: true,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["fruit_item", "snack", "breakfast_fruit"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  // --- 9. Dairy ---
  "dairy-01": {
    mealRoles: ["dairy_milk"],
    primaryRole: "beverage",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["dairy_breakfast", "snack", "cereal_porridge"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "leafy_shak_dish", "heavy_curry"]
  },
  "dairy-02": {
    foodGroup: "plain_yogurt_curd",
    semanticGroup: "plain_yogurt_curd",
    mealRoles: ["dairy_curd"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    // As cooling side in lunch
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["dairy_curd", "snack", "bengali_breakfast"],
    incompatibleGroups: ["shutki_curry"]
  },
  "dairy-03": {
    foodGroup: "plain_yogurt_curd",
    semanticGroup: "plain_yogurt_curd",
    mealRoles: ["dairy_curd"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["dairy_curd", "snack", "bengali_breakfast"],
    incompatibleGroups: ["shutki_curry"]
  },
  // --- 10. Nuts & Seeds ---
  "nuts-01": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-02": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-03": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-04": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-05": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-06": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-07": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-08": {
    mealRoles: ["nut_seed"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "breakfast_topping"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry"]
  },
  "nuts-10": {
    mealRoles: ["nut_seed", "plant_protein_legume"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["nuts_seeds", "snack", "plant_protein_dish"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  // --- 11. Healthy Snacks ---
  "snack-01": {
    mealRoles: ["plant_protein_soy"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: true,
    combinationGroups: ["plant_protein_dish", "snack", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "snack-02": {
    mealRoles: ["plant_protein_soy"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["plant_protein_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "snack-03": {
    mealRoles: ["plant_protein_legume"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["snack", "bengali_breakfast", "plant_protein_dish"],
    incompatibleGroups: []
  },
  "snack-04": {
    mealRoles: ["beverage", "plant_protein_soy"],
    primaryRole: "protein",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["beverage", "cereal_porridge", "snack"],
    incompatibleGroups: ["shutki_curry", "meat_curry"]
  },
  // --- 12. Traditional Bangladeshi Foods ---
  "trad-01": {
    mealRoles: ["staple_composite"],
    primaryRole: "staple",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["bengali_main", "bengali_breakfast", "khichuri_dish"],
    incompatibleGroups: ["cereal_porridge", "fruit_dessert"]
  },
  "trad-02": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "trad-03": {
    mealRoles: ["vegetable_bhaji"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main", "bengali_breakfast"],
    incompatibleGroups: ["cereal_porridge"]
  },
  "trad-04": {
    mealRoles: ["staple_composite"],
    primaryRole: "snack",
    isProteinSource: true,
    isCarbohydrateSource: true,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["bengali_breakfast", "snack"],
    incompatibleGroups: ["fish_curry", "shutki_curry", "meat_curry", "heavy_curry"]
  },
  "trad-05": {
    mealRoles: ["vegetable_curry"],
    primaryRole: "vegetable",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: true,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: true,
    dinnerSuitable: true,
    snackSuitable: false,
    combinationGroups: ["vegetable_dish", "bengali_main"],
    incompatibleGroups: ["cereal_porridge"]
  },
  // --- 13. Oils & Fats ---
  "oil-01": {
    mealRoles: ["oil_fat"],
    primaryRole: "fat",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: false,
    combinationGroups: ["cooking_component"],
    incompatibleGroups: []
  },
  "oil-02": {
    mealRoles: ["oil_fat"],
    primaryRole: "fat",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: false,
    combinationGroups: ["cooking_component"],
    incompatibleGroups: []
  },
  "oil-04": {
    mealRoles: ["oil_fat"],
    primaryRole: "fat",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: false,
    combinationGroups: ["cooking_component"],
    incompatibleGroups: []
  },
  "oil-05": {
    mealRoles: ["oil_fat"],
    primaryRole: "fat",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: true,
    breakfastSuitable: false,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: false,
    combinationGroups: ["cooking_component"],
    incompatibleGroups: []
  },
  // --- 14. Beverages ---
  "bev-01": {
    mealRoles: ["beverage"],
    primaryRole: "beverage",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["beverage", "snack"],
    incompatibleGroups: []
  },
  "bev-02": {
    mealRoles: ["beverage"],
    primaryRole: "beverage",
    isProteinSource: true,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["beverage", "snack"],
    incompatibleGroups: ["shutki_curry", "meat_curry"]
  },
  "bev-03": {
    mealRoles: ["beverage"],
    primaryRole: "beverage",
    isProteinSource: false,
    isCarbohydrateSource: false,
    isVegetable: false,
    isFruit: false,
    isHealthyFat: false,
    breakfastSuitable: true,
    lunchSuitable: false,
    dinnerSuitable: false,
    snackSuitable: true,
    combinationGroups: ["beverage", "snack"],
    incompatibleGroups: []
  }
};
function enrichFoodItem(food) {
  const meta = FOOD_METADATA_MAP[food.id];
  if (!meta) {
    const isVeg = food.category === "Vegetables" || food.category === "Leafy Vegetables";
    const isFruit = food.category === "Fruits";
    const isProtein = ["Fish", "Chicken & Other Poultry", "Meat", "Eggs", "Dal & Legumes"].includes(food.category);
    const isGrain = food.category === "Rice & Grains";
    const isSnack = ["Healthy Snacks", "Nuts & Seeds", "Fruits"].includes(food.category);
    return {
      ...food,
      mealRoles: isGrain ? ["staple_grain"] : isProtein ? ["plant_protein_dal"] : isVeg ? ["vegetable_curry"] : isFruit ? ["whole_fruit"] : ["snack_item"],
      primaryRole: isGrain ? "staple" : isProtein ? "protein" : isVeg ? "vegetable" : isFruit ? "fruit" : "snack",
      isProteinSource: isProtein,
      isCarbohydrateSource: isGrain,
      isVegetable: isVeg,
      isFruit,
      isHealthyFat: false,
      breakfastSuitable: isGrain || isFruit || isSnack,
      lunchSuitable: isGrain || isProtein || isVeg,
      dinnerSuitable: isGrain || isProtein || isVeg,
      snackSuitable: isSnack || isFruit,
      combinationGroups: isGrain || isProtein || isVeg ? ["bengali_main"] : ["snack"],
      incompatibleGroups: []
    };
  }
  const finalFoodGroup = food.foodGroup || meta.foodGroup || food.semanticGroup || meta.semanticGroup;
  return {
    ...food,
    foodGroup: finalFoodGroup,
    semanticGroup: finalFoodGroup,
    mealRoles: meta.mealRoles,
    primaryRole: meta.primaryRole,
    isProteinSource: meta.isProteinSource,
    isCarbohydrateSource: meta.isCarbohydrateSource,
    isVegetable: meta.isVegetable,
    isFruit: meta.isFruit,
    isHealthyFat: meta.isHealthyFat,
    breakfastSuitable: meta.breakfastSuitable,
    lunchSuitable: meta.lunchSuitable,
    dinnerSuitable: meta.dinnerSuitable,
    snackSuitable: meta.snackSuitable,
    combinationGroups: meta.combinationGroups,
    incompatibleGroups: meta.incompatibleGroups
  };
}

// src/data/bangladeshFoodDatabase.ts
var RAW_BANGLADESH_FOOD_DATABASE = [
  // 1. Rice & Grains
  {
    id: "grain-01",
    englishName: "Rice",
    banglaName: "\u09AD\u09BE\u09A4",
    category: "Rice & Grains",
    calories: 195,
    proteinGrams: 3.8,
    carbsGrams: 43.5,
    fatGrams: 0.4,
    fiberGrams: 0.6,
    servingSize: "1 bowl",
    servingUnit: "150g cooked",
    preparationMethod: "Boiled / Steamed",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Primary staple. Mind portion size as excess refined white rice elevates glycemic response.",
    description: "Standard white boiled rice consumed daily in Bangladeshi households."
  },
  {
    id: "grain-02",
    englishName: "Brown Rice",
    banglaName: "\u09AC\u09BE\u09A6\u09BE\u09AE\u09BF \u099A\u09BE\u09B2",
    category: "Rice & Grains",
    calories: 180,
    proteinGrams: 4.2,
    carbsGrams: 39,
    fatGrams: 0.9,
    fiberGrams: 2.4,
    servingSize: "1 bowl",
    servingUnit: "150g cooked",
    preparationMethod: "Boiled",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Medium",
    cookingNotes: "Retains natural bran layer, providing steady energy and higher fiber content.",
    description: "Unpolished whole grain rice high in dietary fiber and essential minerals."
  },
  {
    id: "grain-03",
    englishName: "Red Rice",
    banglaName: "\u09B2\u09BE\u09B2 \u099A\u09BE\u09B2",
    category: "Rice & Grains",
    calories: 185,
    proteinGrams: 4,
    carbsGrams: 40,
    fatGrams: 0.8,
    fiberGrams: 2.2,
    servingSize: "1 bowl",
    servingUnit: "150g cooked",
    preparationMethod: "Boiled",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Traditional Bangladeshi red rice rich in antioxidants and B vitamins.",
    description: "Indigenous red coarse rice with low glycemic index suitable for diabetes management."
  },
  {
    id: "grain-04",
    englishName: "Parboiled Rice",
    banglaName: "\u09B8\u09BF\u09A6\u09CD\u09A7 \u099A\u09BE\u09B2",
    category: "Rice & Grains",
    calories: 190,
    proteinGrams: 4,
    carbsGrams: 41,
    fatGrams: 0.5,
    fiberGrams: 1.2,
    servingSize: "1 bowl",
    servingUnit: "150g cooked",
    preparationMethod: "Parboiled and Boiled",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Soaking prior to milling drives nutrients into the grain kernel.",
    description: "Standard Bangladesh market rice pre-boiled in husk for nutrient retention."
  },
  {
    id: "grain-05",
    englishName: "Chira (Flattened Rice)",
    banglaName: "\u099A\u09BF\u0981\u09A1\u09BC\u09BE",
    category: "Rice & Grains",
    calories: 140,
    proteinGrams: 2.6,
    carbsGrams: 31,
    fatGrams: 0.3,
    fiberGrams: 1,
    servingSize: "1 cup",
    servingUnit: "40g dry soaked",
    preparationMethod: "Soaked / Raw / Roasted",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Very quick to digest. Avoid adding excess sugar when served with banana or milk.",
    description: "Traditional flattened rice flakes popular for breakfast and fast snack meals."
  },
  {
    id: "grain-06",
    englishName: "Muri (Puffed Rice)",
    banglaName: "\u09AE\u09C1\u09A1\u09BC\u09BF",
    category: "Rice & Grains",
    calories: 110,
    proteinGrams: 2,
    carbsGrams: 24.5,
    fatGrams: 0.2,
    fiberGrams: 0.5,
    servingSize: "2 cups",
    servingUnit: "30g dry",
    preparationMethod: "Dry roasted",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Light low-fat snack. Watch added mustard oil and salt when prepared as Jhalmuri.",
    description: "Light crisp Bangladeshi puffed rice snack eaten plain or mixed with chanachur."
  },
  {
    id: "grain-07",
    englishName: "Oats",
    banglaName: "\u0993\u099F\u09B8",
    category: "Rice & Grains",
    calories: 150,
    proteinGrams: 5,
    carbsGrams: 27,
    fatGrams: 2.5,
    fiberGrams: 4,
    servingSize: "1 bowl",
    servingUnit: "40g cooked with water",
    preparationMethod: "Boiled porridge",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Gluten (Cross-contamination)"],
    availability: "High",
    cookingNotes: "Rich in beta-glucan soluble fiber that helps lower blood cholesterol.",
    description: "Whole oat grain imported and widely available in local superstores."
  },
  {
    id: "grain-08",
    englishName: "Roti / Atta Roti",
    banglaName: "\u0986\u099F\u09BE \u09B0\u09C1\u099F\u09BF",
    category: "Rice & Grains",
    calories: 85,
    proteinGrams: 3.2,
    carbsGrams: 17.5,
    fatGrams: 0.6,
    fiberGrams: 2.8,
    servingSize: "1 piece",
    servingUnit: "40g dough / ~30g cooked roti",
    preparationMethod: "Dry roasted on tawa (no oil)",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Gluten / Wheat"],
    availability: "High",
    cookingNotes: "Whole wheat atta roti provides complex carbs and fiber with negligible fat. Ideal breakfast and dinner staple.",
    description: "Traditional unleavened whole wheat flatbread baked on iron tawa."
  },
  {
    id: "grain-09",
    englishName: "Porota (Paratha)",
    banglaName: "\u09AA\u09B0\u09CB\u099F\u09BE",
    category: "Rice & Grains",
    calories: 240,
    proteinGrams: 4.2,
    carbsGrams: 26.5,
    fatGrams: 13,
    fiberGrams: 1.8,
    servingSize: "1 piece",
    servingUnit: "60g cooked with oil",
    preparationMethod: "Layered dough shallow-fried on tawa with oil",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Gluten / Wheat"],
    availability: "High",
    cookingNotes: "Higher fat profile due to oil/ghee layering. Portion-controlled to 1 piece for authentic breakfast enjoyment.",
    description: "Layered pan-fried flatbread crispy on the outside and soft inside."
  },
  // 2. Dal & Legumes
  {
    id: "dal-01",
    englishName: "Masoor Dal (Red Lentil)",
    banglaName: "\u09AE\u09B8\u09C1\u09B0 \u09A1\u09BE\u09B2",
    category: "Dal & Legumes",
    calories: 115,
    proteinGrams: 7.8,
    carbsGrams: 16.5,
    fatGrams: 2.2,
    fiberGrams: 3.8,
    servingSize: "1 bowl",
    servingUnit: "150ml cooked",
    preparationMethod: "Tempered Stew",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Essential everyday source of plant protein. Keep added oil minimal in Bagar (tempering).",
    description: "Red yellow lentil soup tempered with garlic, cumin, and green chillies."
  },
  {
    id: "dal-02",
    englishName: "Moong Dal (Yellow Lentil)",
    banglaName: "\u09AE\u09C1\u0997 \u09A1\u09BE\u09B2",
    category: "Dal & Legumes",
    calories: 125,
    proteinGrams: 8,
    carbsGrams: 17,
    fatGrams: 2.5,
    fiberGrams: 4,
    servingSize: "1 bowl",
    servingUnit: "150ml cooked",
    preparationMethod: "Roasted then simmered",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Very light on the stomach and easy to digest.",
    description: "Roasted yellow split lentils with aromatic taste and low flatulence profile."
  },
  {
    id: "dal-03",
    englishName: "Chola / Chickpeas",
    banglaName: "\u099B\u09CB\u09B2\u09BE",
    category: "Dal & Legumes",
    calories: 160,
    proteinGrams: 8.8,
    carbsGrams: 27,
    fatGrams: 2.6,
    fiberGrams: 7.6,
    servingSize: "1/2 cup",
    servingUnit: "100g boiled",
    preparationMethod: "Boiled / Saut\xE9ed",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High fiber chickpea snack. Avoid heavy frying in excess oil during Ramadan preparation.",
    description: "Whole brown or Garbanzo chickpeas widely consumed boiled or cooked with spices."
  },
  {
    id: "dal-04",
    englishName: "Matar Dal (Yellow Peas)",
    banglaName: "\u09AE\u099F\u09B0 \u09A1\u09BE\u09B2",
    category: "Dal & Legumes",
    calories: 120,
    proteinGrams: 7.5,
    carbsGrams: 18,
    fatGrams: 1.8,
    fiberGrams: 4.5,
    servingSize: "1 bowl",
    servingUnit: "150ml cooked",
    preparationMethod: "Simmered curry",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Sustained energy release with high protein density.",
    description: "Split yellow pea pulse used for dal and traditional snacks."
  },
  {
    id: "dal-05",
    englishName: "Rajma (Kidney Beans)",
    banglaName: "\u09B0\u09BE\u099C\u09AE\u09BE",
    category: "Dal & Legumes",
    calories: 130,
    proteinGrams: 8.5,
    carbsGrams: 22,
    fatGrams: 0.8,
    fiberGrams: 6.4,
    servingSize: "1/2 cup",
    servingUnit: "100g cooked",
    preparationMethod: "Boiled gravy curry",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Medium",
    cookingNotes: "Must be thoroughly boiled before consumption to neutralize naturally occurring lectins.",
    description: "Nutrient-rich red kidney beans packed with dietary fiber and iron."
  },
  {
    id: "dal-06",
    englishName: "Black Gram (Mashkalai Dal)",
    banglaName: "\u09AE\u09BE\u09B7\u0995\u09B2\u09BE\u0987 \u09A1\u09BE\u09B2",
    category: "Dal & Legumes",
    calories: 135,
    proteinGrams: 9,
    carbsGrams: 19,
    fatGrams: 1.5,
    fiberGrams: 5,
    servingSize: "1 bowl",
    servingUnit: "150ml cooked",
    preparationMethod: "Simmered thick soup",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Traditional winter delicacy enjoyed with ruti or rice.",
    description: "Creamy textured black lentil stew rich in calcium and iron."
  },
  // 3. Fish
  {
    id: "fish-01",
    englishName: "Rui Fish",
    banglaName: "\u09B0\u09C1\u0987 \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 145,
    proteinGrams: 18,
    carbsGrams: 1.5,
    fatGrams: 6.5,
    fiberGrams: 0,
    servingSize: "1 medium piece",
    servingUnit: "110g cooked piece with light gravy",
    preparationMethod: "Light Curry (Jhol) / Shallow Fry",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Prefer light tomato/cumin gravy (Jhol) over deep frying to retain lean protein quality.",
    description: "Most popular freshwater major carp in Bangladesh."
  },
  {
    id: "fish-02",
    englishName: "Katla Fish",
    banglaName: "\u0995\u09BE\u09A4\u09B2\u09BE \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 150,
    proteinGrams: 17.8,
    carbsGrams: 1,
    fatGrams: 7.2,
    fiberGrams: 0,
    servingSize: "1 piece",
    servingUnit: "110g cooked piece",
    preparationMethod: "Curry / Shallow Fry",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Large major carp with meaty texture. Excellent source of protein and phosphorus.",
    description: "Large freshwater carp with mild sweet flavor."
  },
  {
    id: "fish-03",
    englishName: "Hilsa Fish (Ilish)",
    banglaName: "\u0987\u09B2\u09BF\u09B6 \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 230,
    proteinGrams: 19.5,
    carbsGrams: 1.2,
    fatGrams: 16,
    fiberGrams: 0,
    servingSize: "1 piece",
    servingUnit: "100g piece",
    preparationMethod: "Steamed / Mustard Curry / Jhol",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "National fish of Bangladesh. Naturally high in beneficial Omega-3 healthy fats.",
    description: "Prized oily river fish rich in essential fatty acids and distinct aroma."
  },
  {
    id: "fish-04",
    englishName: "Pangash Fish",
    banglaName: "\u09AA\u09BE\u0999\u09CD\u0997\u09BE\u09B6 \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 175,
    proteinGrams: 16,
    carbsGrams: 0.5,
    fatGrams: 11.5,
    fiberGrams: 0,
    servingSize: "1 piece",
    servingUnit: "110g cooked piece",
    preparationMethod: "Spicy Curry",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Farmed catfish with higher natural fat content. Trim excess fat before cooking if calorie restricted.",
    description: "Affordable, widely farmed catfish with rich soft texture."
  },
  {
    id: "fish-05",
    englishName: "Tilapia Fish",
    banglaName: "\u09A4\u09C7\u09B2\u09BE\u09AA\u09BF\u09AF\u09BC\u09BE \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 128,
    proteinGrams: 20,
    carbsGrams: 0.5,
    fatGrams: 2.5,
    fiberGrams: 0,
    servingSize: "1 medium fish",
    servingUnit: "120g cooked",
    preparationMethod: "Grilled / Light Gravy",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Very lean freshwater fish ideal for calorie-controlled weight management diets.",
    description: "Common affordable freshwater white fish high in lean protein."
  },
  {
    id: "fish-06",
    englishName: "Pabda Fish",
    banglaName: "\u09AA\u09BE\u09AC\u09A6\u09BE \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 120,
    proteinGrams: 17.5,
    carbsGrams: 0.8,
    fatGrams: 4.8,
    fiberGrams: 0,
    servingSize: "1 whole small fish",
    servingUnit: "90g cooked",
    preparationMethod: "Mustard / Tomato Light Jhol",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "Medium",
    cookingNotes: "Soft delicate catfish, highly digestible for delicate stomachs.",
    description: "Butter catfish prized for tender boneless-like flesh."
  },
  {
    id: "fish-07",
    englishName: "Tengra Fish",
    banglaName: "\u099F\u09C7\u0982\u09B0\u09BE \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 115,
    proteinGrams: 16.5,
    carbsGrams: 0.5,
    fatGrams: 4.2,
    fiberGrams: 0,
    servingSize: "3\u20134 small fish",
    servingUnit: "100g cooked",
    preparationMethod: "Light curry with eggplant or potato",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "Medium",
    cookingNotes: "Small river catfish packed with micro-minerals.",
    description: "Small river catfish cooked with summer vegetables."
  },
  {
    id: "fish-08",
    englishName: "Koi Fish (Climbing Perch)",
    banglaName: "\u0995\u09C8 \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 140,
    proteinGrams: 18,
    carbsGrams: 0.5,
    fatGrams: 6.8,
    fiberGrams: 0,
    servingSize: "1 whole fish",
    servingUnit: "100g cooked",
    preparationMethod: "Tel Koi / Light Jhol",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Nutritious climbing perch traditionally given for illness recovery.",
    description: "Freshwater perch famous for medicinal and strengthening properties."
  },
  {
    id: "fish-09",
    englishName: "Mola Fish",
    banglaName: "\u09AE\u09B2\u09BE \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 110,
    proteinGrams: 15,
    carbsGrams: 0.8,
    fatGrams: 4.5,
    fiberGrams: 0,
    servingSize: "1/2 cup",
    servingUnit: "80g cooked small fish",
    preparationMethod: "Chorchori / Small Fry",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Eaten whole with bones, supplying exceptionally high Vitamin A and bioavailable calcium.",
    description: "Tiny freshwater fish extremely rich in Vitamin A and bone calcium."
  },
  {
    id: "fish-10",
    englishName: "Small Fish (Choto Mach)",
    banglaName: "\u099B\u09CB\u099F \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 115,
    proteinGrams: 16,
    carbsGrams: 1,
    fatGrams: 4.5,
    fiberGrams: 0,
    servingSize: "1 bowl",
    servingUnit: "100g Chorchori",
    preparationMethod: "Chorchori (Dry vegetable fry with fish)",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Excellent micronutrient profile. Avoid drowning in excess oil during Chorchori preparation.",
    description: "Assorted indigenous small river fishes cooked with chopped vegetables."
  },
  {
    id: "fish-11",
    englishName: "Shutki (Dried Fish)",
    banglaName: "\u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 220,
    proteinGrams: 38,
    carbsGrams: 2,
    fatGrams: 6,
    fiberGrams: 0,
    servingSize: "2 tbsp bhorta or curry",
    servingUnit: "50g cooked",
    preparationMethod: "Bhorta / Spicy Roast / Curry",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Concentrated protein and calcium. Note high sodium content if managing hypertension.",
    description: "Sun-dried fish delicacy cooked as spicy bhorta or vegetable curry."
  },
  {
    id: "fish-13",
    englishName: "Shing Fish",
    banglaName: "\u09B6\u09BF\u0982 \u09AE\u09BE\u099B",
    category: "Fish",
    calories: 115,
    proteinGrams: 21,
    carbsGrams: 0.5,
    fatGrams: 2.8,
    fiberGrams: 0,
    servingSize: "1 piece",
    servingUnit: "100g light curry",
    preparationMethod: "Light digestive broth (Jhol) with raw papaya and roasted cumin",
    isVegetarian: false,
    isVegan: false,
    allergies: ["Fish"],
    availability: "High",
    cookingNotes: "Indigenous live freshwater fish (Jiyol Mach) rich in bioavailable iron and protein. Traditionally recommended for convalescence, vitality, and stamina.",
    description: "Nutrient-dense freshwater stinging catfish cooked as a soothing, easily digestible light stew."
  },
  // 4. Chicken & Other Poultry
  {
    id: "poultry-01",
    englishName: "Chicken Curry",
    banglaName: "\u09AE\u09C1\u09B0\u0997\u09BF\u09B0 \u09AE\u09BE\u0982\u09B8",
    category: "Chicken & Other Poultry",
    calories: 185,
    proteinGrams: 22,
    carbsGrams: 3,
    fatGrams: 8.5,
    fiberGrams: 0.5,
    servingSize: "2 medium pieces",
    servingUnit: "130g with light gravy",
    preparationMethod: "Deshi Curry (Jhol)",
    isVegetarian: false,
    isVegan: false,
    allergies: [],
    availability: "High",
    cookingNotes: "Skinless chicken cooked in onion-garlic ginger gravy provides high quality lean protein.",
    description: "Standard Bangladeshi chicken curry cooked with potatoes and spices."
  },
  // 5. Meat
  {
    id: "meat-01",
    englishName: "Lean Beef",
    banglaName: "\u099A\u09B0\u09CD\u09AC\u09BF\u09B9\u09C0\u09A8 \u0997\u09B0\u09C1\u09B0 \u09AE\u09BE\u0982\u09B8",
    category: "Meat",
    calories: 210,
    proteinGrams: 24,
    carbsGrams: 2,
    fatGrams: 11,
    fiberGrams: 0,
    servingSize: "2 pieces",
    servingUnit: "120g cooked",
    preparationMethod: "Bhuna / Stew Curry",
    isVegetarian: false,
    isVegan: false,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in heme iron and Vitamin B12. Trim visible white fat before cooking.",
    description: "Trimmed lean beef cooked in traditional warm Bangladeshi spices."
  },
  {
    id: "meat-02",
    englishName: "Lean Mutton (Khasi)",
    banglaName: "\u099A\u09B0\u09CD\u09AC\u09BF\u09B9\u09C0\u09A8 \u0996\u09BE\u09B8\u09BF\u09B0 \u09AE\u09BE\u0982\u09B8",
    category: "Meat",
    calories: 225,
    proteinGrams: 22.5,
    carbsGrams: 2,
    fatGrams: 13.5,
    fiberGrams: 0,
    servingSize: "2 pieces",
    servingUnit: "120g cooked",
    preparationMethod: "KOSHA / Curry",
    isVegetarian: false,
    isVegan: false,
    allergies: [],
    availability: "High",
    cookingNotes: "High iron content. Eat in moderation due to saturated fat content.",
    description: "Goat mutton curry cooked with potatoes and whole spices."
  },
  // 6. Eggs
  {
    id: "egg-01",
    englishName: "Egg (Boiled / Curry)",
    banglaName: "\u09A1\u09BF\u09AE",
    category: "Eggs",
    calories: 78,
    proteinGrams: 6.3,
    carbsGrams: 0.6,
    fatGrams: 5.3,
    fiberGrams: 0,
    servingSize: "1 large egg",
    servingUnit: "50g whole egg",
    preparationMethod: "Hard Boiled / Poached / Curry",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Egg"],
    availability: "High",
    cookingNotes: "Complete protein source with all essential amino acids and choline.",
    description: "Whole chicken egg consumed boiled, omelette, or in tomato gravy."
  },
  // 7. Vegetables
  {
    id: "veg-01",
    englishName: "Bottle Gourd (Lau)",
    banglaName: "\u09B2\u09BE\u0989",
    category: "Vegetables",
    calories: 35,
    proteinGrams: 1.2,
    carbsGrams: 6.5,
    fatGrams: 0.5,
    fiberGrams: 1.8,
    servingSize: "1 bowl",
    servingUnit: "120g cooked with shrimp/dal",
    preparationMethod: "Stewed with prawn or dal",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "95% water content. Extremely cooling and low-calorie for weight management.",
    description: "Hydrating summer vegetable cooked light with prawns or lentils."
  },
  {
    id: "veg-02",
    englishName: "Pointed Gourd (Patol)",
    banglaName: "\u09AA\u099F\u09B2",
    category: "Vegetables",
    calories: 45,
    proteinGrams: 1.5,
    carbsGrams: 5,
    fatGrams: 2,
    fiberGrams: 2.2,
    servingSize: "3\u20134 pieces",
    servingUnit: "100g cooked",
    preparationMethod: "Bhaji / Mustard Curry / Vorta",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Saut\xE9 with minimal oil for optimum health benefits.",
    description: "Green striped gourd popular fried or cooked in gravy."
  },
  {
    id: "veg-03",
    englishName: "Ridge Gourd (Jhinge)",
    banglaName: "\u099D\u09BF\u0999\u09C7",
    category: "Vegetables",
    calories: 30,
    proteinGrams: 1,
    carbsGrams: 4.5,
    fatGrams: 0.8,
    fiberGrams: 1.5,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Fish curry / Bhaji",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Low calorie, delicate summer vegetable.",
    description: "Ridged green gourd cooked with small fish or prawns."
  },
  {
    id: "veg-04",
    englishName: "Snake Gourd (Chichinga)",
    banglaName: "\u099A\u09BF\u099A\u09BF\u0999\u09CD\u0997\u09BE",
    category: "Vegetables",
    calories: 32,
    proteinGrams: 1.1,
    carbsGrams: 5.2,
    fatGrams: 0.6,
    fiberGrams: 1.8,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Stir fry with egg or prawns",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High water and fiber content, aids smooth digestion.",
    description: "Long striped gourd cooked chopped in light spices."
  },
  {
    id: "veg-05",
    englishName: "Bitter Gourd (Korola)",
    banglaName: "\u0995\u09B0\u09B2\u09BE",
    category: "Vegetables",
    calories: 40,
    proteinGrams: 1.8,
    carbsGrams: 5.8,
    fatGrams: 1.2,
    fiberGrams: 2.8,
    servingSize: "1/2 cup",
    servingUnit: "90g Bhaji",
    preparationMethod: "Thin sliced stir fry with potato",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Contains Charantin compound which supports healthy blood glucose regulation.",
    description: "Bumpy bitter melon famous for diabetes management properties."
  },
  {
    id: "veg-06",
    englishName: "Eggplant (Begun)",
    banglaName: "\u09AC\u09C7\u0997\u09C1\u09A8",
    category: "Vegetables",
    calories: 65,
    proteinGrams: 1.4,
    carbsGrams: 7,
    fatGrams: 3.5,
    fiberGrams: 3,
    servingSize: "1/2 cup",
    servingUnit: "100g cooked",
    preparationMethod: "Bhorta / Begun Bhaji / Curry",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Aubergines act like a sponge absorbing frying oil. Prefer roasted Bhorta over deep-fried Begun Bhaji.",
    description: "Purple eggplant roasted for bhorta or cooked in mustard fish gravy."
  },
  {
    id: "veg-07",
    englishName: "Okra (Dherosh / Ladyfinger)",
    banglaName: "\u09A2\u09C7\u0981\u09A1\u09BC\u09B8",
    category: "Vegetables",
    calories: 42,
    proteinGrams: 2,
    carbsGrams: 7.2,
    fatGrams: 1,
    fiberGrams: 3.2,
    servingSize: "1 bowl",
    servingUnit: "100g cooked",
    preparationMethod: "Saut\xE9ed Bhaji / Mustard Curry",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Mucilage fiber binds cholesterol during digestion.",
    description: "Tender ladyfinger pods cooked as stir fry or in fish curries."
  },
  {
    id: "veg-08",
    englishName: "Yardlong Bean (Borboti)",
    banglaName: "\u09AC\u09B0\u09AC\u099F\u09BF",
    category: "Vegetables",
    calories: 48,
    proteinGrams: 2.8,
    carbsGrams: 8,
    fatGrams: 0.8,
    fiberGrams: 3.5,
    servingSize: "1 bowl",
    servingUnit: "100g cooked",
    preparationMethod: "Chopped Bhaji with potatoes",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High protein and green fiber bean.",
    description: "Long green pod beans chopped and stir fried with garlic."
  },
  {
    id: "veg-09",
    englishName: "Hyacinth Bean (Shim)",
    banglaName: "\u09B6\u09BF\u09AE",
    category: "Vegetables",
    calories: 52,
    proteinGrams: 3.2,
    carbsGrams: 8.5,
    fatGrams: 0.9,
    fiberGrams: 3.8,
    servingSize: "1 bowl",
    servingUnit: "100g cooked",
    preparationMethod: "Winter Fish curry / Mustard Bhorta",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "Winter specialty bean rich in protein and folate.",
    description: "Flat winter beans cooked with mustard paste or fish."
  },
  {
    id: "veg-10",
    englishName: "Pumpkin (Mishti Kumra)",
    banglaName: "\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0995\u09C1\u09AE\u09A1\u09BC\u09BE",
    category: "Vegetables",
    calories: 50,
    proteinGrams: 1.3,
    carbsGrams: 10.5,
    fatGrams: 0.8,
    fiberGrams: 2,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Mashed Bhorta / Stew",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High Beta-carotene (Vitamin A precursor) for eye health.",
    description: "Sweet orange pumpkin cooked in yellow spice curry or bhorta."
  },
  {
    id: "veg-11",
    englishName: "Green Papaya (Kacha Pepe)",
    banglaName: "\u0995\u09BE\u0981\u099A\u09BE \u09AA\u09C7\u0981\u09AA\u09C7",
    category: "Vegetables",
    calories: 38,
    proteinGrams: 1,
    carbsGrams: 8,
    fatGrams: 0.4,
    fiberGrams: 2.5,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Boiled in meat/fish stew or Bhaji",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Contains Papain enzyme which acts as a natural meat tenderizer and digestive aid.",
    description: "Unripe papaya cooked in meat curries or boiled as healthy bhorta."
  },
  {
    id: "veg-12",
    englishName: "Potato (Aloo)",
    banglaName: "\u0986\u09B2\u09C1",
    category: "Vegetables",
    calories: 110,
    proteinGrams: 2.5,
    carbsGrams: 24,
    fatGrams: 0.2,
    fiberGrams: 2.2,
    servingSize: "1 medium potato",
    servingUnit: "120g boiled",
    preparationMethod: "Boiled / Bhorta / Curry component",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High carbohydrate vegetable. Account for potato carbs when consuming with rice.",
    description: "Everyday Bangladeshi staple vegetable added to curries or mashed into Aloo Bhorta."
  },
  {
    id: "veg-13",
    englishName: "Carrot (Gajor)",
    banglaName: "\u0997\u09BE\u099C\u09B0",
    category: "Vegetables",
    calories: 45,
    proteinGrams: 1,
    carbsGrams: 10,
    fatGrams: 0.3,
    fiberGrams: 2.8,
    servingSize: "1 medium carrot",
    servingUnit: "100g raw/cooked",
    preparationMethod: "Raw Salad / Cooked",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Concentrated source of Beta-carotene and antioxidant fiber.",
    description: "Crunchy orange root vegetable eaten raw in salads or cooked in mixed vegetables."
  },
  {
    id: "veg-14",
    englishName: "Cucumber (Shosa)",
    banglaName: "\u09B6\u09B8\u09BE",
    category: "Vegetables",
    calories: 18,
    proteinGrams: 0.7,
    carbsGrams: 3.8,
    fatGrams: 0.1,
    fiberGrams: 1,
    servingSize: "1 cup sliced",
    servingUnit: "100g raw",
    preparationMethod: "Raw Salad",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Ideal high-volume, low-calorie side salad component.",
    description: "Refreshing cucumber served raw alongside heavy meals."
  },
  {
    id: "veg-15",
    englishName: "Tomato",
    banglaName: "\u099F\u09AE\u09C7\u099F\u09CB",
    category: "Vegetables",
    calories: 22,
    proteinGrams: 1,
    carbsGrams: 4.5,
    fatGrams: 0.2,
    fiberGrams: 1.4,
    servingSize: "1 medium tomato",
    servingUnit: "100g raw/cooked",
    preparationMethod: "Salad / Curry base / Tok",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Lycopene antioxidant content increases when tomatoes are lightly cooked with oil.",
    description: "Juicy tomato essential for Bangladeshi salad and curry gravies."
  },
  {
    id: "veg-16",
    englishName: "Cauliflower (Fulkopi)",
    banglaName: "\u09AB\u09C1\u09B2\u0995\u09AA\u09BF",
    category: "Vegetables",
    calories: 55,
    proteinGrams: 2.5,
    carbsGrams: 7,
    fatGrams: 2,
    fiberGrams: 2.8,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Curry with fish or potato",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "Cruciferous vegetable rich in sulforaphane and Vitamin C.",
    description: "Winter white cauliflower florets cooked in savory curries."
  },
  {
    id: "veg-17",
    englishName: "Cabbage (Bandhakopi)",
    banglaName: "\u09AC\u09BE\u0981\u09A7\u09BE\u0995\u09AA\u09BF",
    category: "Vegetables",
    calories: 48,
    proteinGrams: 2,
    carbsGrams: 6.5,
    fatGrams: 1.8,
    fiberGrams: 2.5,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Chopped stir-fry (Bhaji)",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "High vitamin C and gut-friendly prebiotic fiber.",
    description: "Shredded cabbage cooked with green peas and cumin."
  },
  {
    id: "veg-18",
    englishName: "Aloo Bhaji",
    banglaName: "\u0986\u09B2\u09C1 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 115,
    proteinGrams: 2.2,
    carbsGrams: 20,
    fatGrams: 3.5,
    fiberGrams: 2.4,
    servingSize: "1 small bowl",
    servingUnit: "90g stir-fry",
    preparationMethod: "Julienned potato saut\xE9ed with kalonji, green chilli, and minimal mustard oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Quintessential Bangladeshi breakfast side paired with warm atta roti or porota.",
    description: "Finely sliced potatoes stir-fried with nigella seeds and green chillies."
  },
  {
    id: "veg-19",
    englishName: "Begun Bhaji",
    banglaName: "\u09AC\u09C7\u0997\u09C1\u09A8 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 95,
    proteinGrams: 1.6,
    carbsGrams: 8,
    fatGrams: 6.5,
    fiberGrams: 3.5,
    servingSize: "2 round slices",
    servingUnit: "100g pan-fried",
    preparationMethod: "Sliced eggplant marinated in turmeric & salt, pan-seared with light mustard oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in nasunin antioxidant. Pan-sear with light oil rather than deep frying.",
    description: "Spiced turmeric pan-fried eggplant rounds paired with khichuri, dal, or roti."
  },
  {
    id: "veg-20",
    englishName: "Lau Bhaji / Niramish",
    banglaName: "\u09B2\u09BE\u0989 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 52,
    proteinGrams: 1.4,
    carbsGrams: 6.5,
    fatGrams: 2.4,
    fiberGrams: 2.6,
    servingSize: "1 bowl",
    servingUnit: "120g cooked",
    preparationMethod: "Finely shredded bottle gourd stir-fried with cumin, green chilli, and coriander",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Ultra light and hydrating, excellent for digestion and blood pressure management.",
    description: "Shredded bottle gourd saut\xE9ed lightly with cumin seeds and fresh coriander."
  },
  {
    id: "veg-21",
    englishName: "Potol Bhaji",
    banglaName: "\u09AA\u099F\u09B2 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 72,
    proteinGrams: 2,
    carbsGrams: 6,
    fatGrams: 4.5,
    fiberGrams: 3,
    servingSize: "2 slit pieces",
    servingUnit: "90g saut\xE9ed",
    preparationMethod: "Slit pointed gourd shallow fried with turmeric and salt",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in dietary fiber and Vitamin A. Pairs wonderfully with rice and masoor dal.",
    description: "Lightly saut\xE9ed pointed gourd slices seasoned with mild Bangladeshi spices."
  },
  {
    id: "veg-22",
    englishName: "Jhinge Bhaji",
    banglaName: "\u099D\u09BF\u0999\u09C7 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 48,
    proteinGrams: 1.3,
    carbsGrams: 5.2,
    fatGrams: 2.5,
    fiberGrams: 2.5,
    servingSize: "1 bowl",
    servingUnit: "110g stir-fry",
    preparationMethod: "Chopped ridge gourd saut\xE9ed with onions and nigella seeds",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Low in calories and high in dietary moisture and cellulose fiber.",
    description: "Tender ridge gourd stir-fried with onions and green chillies."
  },
  {
    id: "veg-23",
    englishName: "Chichinga Bhaji",
    banglaName: "\u099A\u09BF\u099A\u09BF\u0999\u09CD\u0997\u09BE \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 45,
    proteinGrams: 1.2,
    carbsGrams: 4.8,
    fatGrams: 2.4,
    fiberGrams: 2.4,
    servingSize: "1 bowl",
    servingUnit: "110g stir-fry",
    preparationMethod: "Sliced snake gourd saut\xE9ed with turmeric and kalonji",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Cooling summer vegetable with high natural water content.",
    description: "Sliced snake gourd stir-fried with mild spices and coriander."
  },
  {
    id: "veg-24",
    englishName: "Dherosh Bhaji",
    banglaName: "\u09A2\u09C7\u0981\u09A1\u09BC\u09B8 \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 65,
    proteinGrams: 2.2,
    carbsGrams: 7.2,
    fatGrams: 3.2,
    fiberGrams: 3.4,
    servingSize: "1 bowl",
    servingUnit: "100g stir-fry",
    preparationMethod: "Sliced okra stir-fried with sliced onions and green chillies",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High soluble mucilage fiber that helps stabilize blood glucose levels.",
    description: "Crisp stir-fried okra seasoned with onions and whole cumin seeds."
  },
  {
    id: "veg-25",
    englishName: "Bandhakopi Bhaji",
    banglaName: "\u09AC\u09BE\u0981\u09A7\u09BE\u0995\u09AA\u09BF \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 75,
    proteinGrams: 2.4,
    carbsGrams: 8.5,
    fatGrams: 3.4,
    fiberGrams: 3.6,
    servingSize: "1 bowl",
    servingUnit: "120g stir-fry",
    preparationMethod: "Shredded cabbage stir-fried with green peas and ginger",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Abundant in glucosinolates and Vitamin C. Classic winter breakfast/lunch side.",
    description: "Shredded winter cabbage stir-fried with green peas and cumin."
  },
  {
    id: "veg-26",
    englishName: "Fulkopi Bhaji",
    banglaName: "\u09AB\u09C1\u09B2\u0995\u09AA\u09BF \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 78,
    proteinGrams: 2.6,
    carbsGrams: 7.8,
    fatGrams: 3.8,
    fiberGrams: 3.2,
    servingSize: "1 bowl",
    servingUnit: "110g stir-fry",
    preparationMethod: "Cauliflower florets saut\xE9ed with potatoes, turmeric, and cumin",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in choline and Vitamin C. Cook with minimal oil to keep calories balanced.",
    description: "Tender spiced cauliflower florets stir-fried in traditional Bangladeshi style."
  },
  {
    id: "veg-27",
    englishName: "Shim Bhaji",
    banglaName: "\u09B6\u09BF\u09AE \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 82,
    proteinGrams: 3.8,
    carbsGrams: 9.2,
    fatGrams: 3.2,
    fiberGrams: 4.2,
    servingSize: "1 bowl",
    servingUnit: "100g stir-fry",
    preparationMethod: "Chopped hyacinth flat beans saut\xE9ed with mustard paste or garlic",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High in plant protein and dietary fiber for satiety.",
    description: "Fresh winter hyacinth flat beans stir-fried with garlic and chillies."
  },
  {
    id: "veg-28",
    englishName: "Tomato Salad",
    banglaName: "\u099F\u09AE\u09C7\u099F\u09CB \u09B8\u09BE\u09B2\u09BE\u09A6",
    category: "Vegetables",
    calories: 32,
    proteinGrams: 1.2,
    carbsGrams: 6,
    fatGrams: 0.4,
    fiberGrams: 2,
    servingSize: "1 bowl",
    servingUnit: "120g fresh salad",
    preparationMethod: "Sliced fresh ripe tomatoes with sliced onion, coriander, green chilli, and lemon juice",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Packed with lycopene antioxidant and Vitamin C. Fresh accompaniment to rice or roti.",
    description: "Refreshing Bangladeshi tomato salad seasoned with fresh lemon and coriander."
  },
  {
    id: "veg-29",
    englishName: "Cucumber Salad",
    banglaName: "\u09B6\u09B8\u09BE \u09B8\u09BE\u09B2\u09BE\u09A6",
    category: "Vegetables",
    calories: 22,
    proteinGrams: 0.9,
    carbsGrams: 4.2,
    fatGrams: 0.2,
    fiberGrams: 1.4,
    servingSize: "1 bowl",
    servingUnit: "130g fresh salad",
    preparationMethod: "Sliced local cucumber tossed with lemon juice, green chilli, and rock salt",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Hydrating, virtually zero fat, ideal volume side for weight management.",
    description: "Crisp fresh cucumber salad with lemon juice and a pinch of rock salt."
  },
  {
    id: "veg-30",
    englishName: "Mishti Kumra Bhaji",
    banglaName: "\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0995\u09C1\u09AE\u09A1\u09BC\u09BE \u09AD\u09BE\u099C\u09BF",
    category: "Vegetables",
    calories: 68,
    proteinGrams: 1.5,
    carbsGrams: 10.8,
    fatGrams: 2.4,
    fiberGrams: 2.8,
    servingSize: "1 bowl",
    servingUnit: "110g stir-fry",
    preparationMethod: "Diced sweet pumpkin stir-fried with nigella seeds and green chillies",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Abundant in beta-carotene (pro-Vitamin A) for ocular and skin health.",
    description: "Tender sweet pumpkin cubes saut\xE9ed with kalonji and mild spices."
  },
  // 8. Leafy Vegetables
  {
    id: "leafy-01",
    englishName: "Spinach (Palong Shak)",
    banglaName: "\u09AA\u09BE\u09B2\u0982 \u09B6\u09BE\u0995",
    category: "Leafy Vegetables",
    calories: 35,
    proteinGrams: 3,
    carbsGrams: 4,
    fatGrams: 1,
    fiberGrams: 2.6,
    servingSize: "1/2 cup cooked",
    servingUnit: "100g cooked",
    preparationMethod: "Saut\xE9ed with garlic & mustard oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Dense in iron, folate, and calcium. Pair with Vitamin C for optimal non-heme iron absorption.",
    description: "Tender spinach leaves cooked as Bhaji or with small prawns."
  },
  {
    id: "leafy-02",
    englishName: "Red Amaranth (Lal Shak)",
    banglaName: "\u09B2\u09BE\u09B2 \u09B6\u09BE\u0995",
    category: "Leafy Vegetables",
    calories: 38,
    proteinGrams: 3.2,
    carbsGrams: 4.8,
    fatGrams: 0.8,
    fiberGrams: 3,
    servingSize: "1/2 cup cooked",
    servingUnit: "100g cooked",
    preparationMethod: "Stir fried with garlic & chillies",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Vibrant red pigment anthocyanins provide potent cellular protection.",
    description: "Popular red leafy green saut\xE9ed with garlic and green chillies."
  },
  {
    id: "leafy-03",
    englishName: "Water Spinach (Kolmi Shak)",
    banglaName: "\u0995\u09B2\u09AE\u09BF \u09B6\u09BE\u0995",
    category: "Leafy Vegetables",
    calories: 30,
    proteinGrams: 2.6,
    carbsGrams: 3.5,
    fatGrams: 0.6,
    fiberGrams: 2.2,
    servingSize: "1/2 cup cooked",
    servingUnit: "100g cooked",
    preparationMethod: "Stir fry with onion & garlic",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High iron, low calorie wild greens.",
    description: "Hollow stem aquatic greens saut\xE9ed crunchy with garlic."
  },
  {
    id: "leafy-04",
    englishName: "Malabar Spinach (Pui Shak)",
    banglaName: "\u09AA\u09C1\u0981\u0987 \u09B6\u09BE\u0995",
    category: "Leafy Vegetables",
    calories: 42,
    proteinGrams: 2.8,
    carbsGrams: 5.5,
    fatGrams: 1,
    fiberGrams: 2.8,
    servingSize: "1 bowl cooked",
    servingUnit: "120g cooked with pumpkin/prawn",
    preparationMethod: "Curry with pumpkin or fish head",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Thick succulent leaves rich in Vitamin A, calcium, and magnesium.",
    description: "Thick climbing vine green cooked with pumpkin and prawns."
  },
  {
    id: "leafy-05",
    englishName: "Stem Amaranth (Data Shak)",
    banglaName: "\u09A1\u09BE\u0981\u099F\u09BE \u09B6\u09BE\u0995",
    category: "Leafy Vegetables",
    calories: 35,
    proteinGrams: 2.4,
    carbsGrams: 4.5,
    fatGrams: 0.6,
    fiberGrams: 2.5,
    servingSize: "1 bowl",
    servingUnit: "110g cooked",
    preparationMethod: "Curry with mustard paste or small fish",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Eaten for soft chewy stems packed with minerals.",
    description: "Long juicy amaranth stems cooked in mustard vegetable chorchori."
  },
  // 9. Fruits
  {
    id: "fruit-01",
    englishName: "Guava (Peyara)",
    banglaName: "\u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE",
    category: "Fruits",
    calories: 68,
    proteinGrams: 2.6,
    carbsGrams: 14.3,
    fatGrams: 0.9,
    fiberGrams: 5.4,
    servingSize: "1 medium fruit",
    servingUnit: "120g whole fruit",
    preparationMethod: "Raw fresh slice",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Contains over 200% daily Vitamin C requirement in a single fruit. Outstanding fiber content.",
    description: "Crisp green local guava rich in Vitamin C and fiber."
  },
  {
    id: "fruit-02",
    englishName: "Ripe Papaya (Pepe)",
    banglaName: "\u09AA\u09C7\u0981\u09AA\u09C7",
    category: "Fruits",
    calories: 55,
    proteinGrams: 0.8,
    carbsGrams: 13.5,
    fatGrams: 0.3,
    fiberGrams: 2.2,
    servingSize: "1 slice / bowl",
    servingUnit: "130g cubed",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Soothing for gastric acidity and bowel regularity.",
    description: "Sweet orange tropical fruit loaded with Papain and Vitamin A."
  },
  {
    id: "fruit-03",
    englishName: "Banana (Kola)",
    banglaName: "\u0995\u09B2\u09BE",
    category: "Fruits",
    calories: 90,
    proteinGrams: 1.2,
    carbsGrams: 23,
    fatGrams: 0.3,
    fiberGrams: 2.6,
    servingSize: "1 medium banana",
    servingUnit: "100g peeled",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Quick natural energy with high potassium to prevent muscle cramps.",
    description: "Local varieties like Sagar, Sabri, or Champa banana eaten daily."
  },
  {
    id: "fruit-04",
    englishName: "Mango (Aam)",
    banglaName: "\u0986\u09AE",
    category: "Fruits",
    calories: 85,
    proteinGrams: 0.9,
    carbsGrams: 20,
    fatGrams: 0.4,
    fiberGrams: 2,
    servingSize: "1 cup sliced",
    servingUnit: "130g fruit pulp",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "High natural fruit sugar. Enjoy in controlled portions if monitoring blood glucose.",
    description: "Famous summer mango varieties (Himsagar, Langra, Amrupali) rich in Vitamin A."
  },
  {
    id: "fruit-05",
    englishName: "Jackfruit (Kathal)",
    banglaName: "\u0995\u09BE\u0981\u09A0\u09BE\u09B2",
    category: "Fruits",
    calories: 95,
    proteinGrams: 1.7,
    carbsGrams: 23.5,
    fatGrams: 0.6,
    fiberGrams: 1.6,
    servingSize: "4\u20135 bulbs",
    servingUnit: "100g fruit bulbs",
    preparationMethod: "Raw fresh ripe fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "National fruit of Bangladesh. High energy density.",
    description: "Sweet aromatic national fruit packed with minerals and energy."
  },
  {
    id: "fruit-06",
    englishName: "Pineapple (Anaras)",
    banglaName: "\u0986\u09A8\u09BE\u09B0\u09B8",
    category: "Fruits",
    calories: 50,
    proteinGrams: 0.5,
    carbsGrams: 13,
    fatGrams: 0.1,
    fiberGrams: 1.4,
    servingSize: "1 cup cubed",
    servingUnit: "100g fresh fruit",
    preparationMethod: "Raw sliced",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Contains Bromelain anti-inflammatory enzyme that supports protein digestion.",
    description: "Tangy sweet tropical pineapple harvested in Sylhet and Chittagong hill tracts."
  },
  {
    id: "fruit-07",
    englishName: "Watermelon (Tormuj)",
    banglaName: "\u09A4\u09B0\u09AE\u09C1\u099C",
    category: "Fruits",
    calories: 30,
    proteinGrams: 0.6,
    carbsGrams: 7.5,
    fatGrams: 0.2,
    fiberGrams: 0.4,
    servingSize: "2 cups cubed",
    servingUnit: "150g fresh fruit",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "92% water content. Excellent summer rehydration fruit packed with Lycopene.",
    description: "Juicy summer melon widely consumed during hot weather and Ramadan."
  },
  {
    id: "fruit-08",
    englishName: "Orange (Komla)",
    banglaName: "\u0995\u09AE\u09B2\u09BE",
    category: "Fruits",
    calories: 60,
    proteinGrams: 1.2,
    carbsGrams: 15,
    fatGrams: 0.2,
    fiberGrams: 3,
    servingSize: "1 medium orange",
    servingUnit: "130g fruit",
    preparationMethod: "Raw fresh peeled",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High Vitamin C and citrus flavonoids boosting immunity.",
    description: "Citrus orange fruit consumed fresh or as un-sweetened juice."
  },
  {
    id: "fruit-09",
    englishName: "Malta",
    banglaName: "\u09AE\u09BE\u09B2\u09CD\u099F\u09BE",
    category: "Fruits",
    calories: 58,
    proteinGrams: 1.1,
    carbsGrams: 14.5,
    fatGrams: 0.2,
    fiberGrams: 2.8,
    servingSize: "1 medium fruit",
    servingUnit: "120g fruit",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Local citrus variety with mild acidity and high electrolyte content.",
    description: "Sweet green/yellow local citrus fruit high in Vitamin C."
  },
  {
    id: "fruit-10",
    englishName: "Coconut Water & Meat (Narkel / Dab)",
    banglaName: "\u09A8\u09BE\u09B0\u0995\u09C7\u09B2 / \u09A1\u09BE\u09AC",
    category: "Fruits",
    calories: 45,
    proteinGrams: 0.7,
    carbsGrams: 8.8,
    fatGrams: 0.5,
    fiberGrams: 1.1,
    servingSize: "1 green coconut water",
    servingUnit: "200ml natural water",
    preparationMethod: "Natural fresh beverage",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Natural isotonic electrolyte drink loaded with potassium and sodium.",
    description: "Fresh green coconut water directly from the shell."
  },
  {
    id: "fruit-11",
    englishName: "Pomegranate (Dalim / Anar)",
    banglaName: "\u09A1\u09BE\u09B2\u09BF\u09AE",
    category: "Fruits",
    calories: 83,
    proteinGrams: 1.7,
    carbsGrams: 18.5,
    fatGrams: 1.2,
    fiberGrams: 4,
    servingSize: "1/2 cup arils",
    servingUnit: "100g arils",
    preparationMethod: "Raw fresh seed arils",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Punicalagin polyphenols offer extraordinary cardiovascular protection.",
    description: "Red ruby pomegranate arils high in antioxidants and iron."
  },
  {
    id: "fruit-12",
    englishName: "Star Fruit (Kamranga)",
    banglaName: "\u0995\u09BE\u09AE\u09B0\u09BE\u0999\u09BE",
    category: "Fruits",
    calories: 31,
    proteinGrams: 1,
    carbsGrams: 6.7,
    fatGrams: 0.3,
    fiberGrams: 2.8,
    servingSize: "1 fruit",
    servingUnit: "90g fresh fruit",
    preparationMethod: "Raw fresh sliced",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Note: Contains high oxalate content; individuals with kidney dysfunction should avoid.",
    description: "Star-shaped sour fruit rich in Vitamin C."
  },
  {
    id: "fruit-13",
    englishName: "Jujube (Kul / Boroi)",
    banglaName: "\u0995\u09C1\u09B2 / \u09AC\u09B0\u0987",
    category: "Fruits",
    calories: 60,
    proteinGrams: 1.2,
    carbsGrams: 15,
    fatGrams: 0.2,
    fiberGrams: 3.5,
    servingSize: "8\u201310 small plums",
    servingUnit: "100g fresh fruit",
    preparationMethod: "Raw fresh fruit",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Seasonal",
    cookingNotes: "High Vitamin C and dietary pectin for digestion.",
    description: "Crisp sour-sweet Bangladeshi jujube plums available in late winter."
  },
  {
    id: "fruit-14",
    englishName: "Apple",
    banglaName: "\u0986\u09AA\u09C7\u09B2",
    category: "Fruits",
    calories: 78,
    proteinGrams: 0.5,
    carbsGrams: 19.5,
    fatGrams: 0.2,
    fiberGrams: 3.8,
    servingSize: "1 medium fruit",
    servingUnit: "150g whole apple",
    preparationMethod: "Fresh whole fruit washed with skin",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in pectin soluble fiber and quercetin flavonoid.",
    description: "Crisp whole fresh apple rich in soluble fiber and antioxidants."
  },
  // 10. Dairy
  {
    id: "dairy-01",
    englishName: "Cow Milk (Dudh)",
    banglaName: "\u09A6\u09C1\u09A7",
    category: "Dairy",
    calories: 120,
    proteinGrams: 6.4,
    carbsGrams: 9.6,
    fatGrams: 6.5,
    fiberGrams: 0,
    servingSize: "1 glass",
    servingUnit: "200ml boiled milk",
    preparationMethod: "Boiled",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Dairy / Lactose"],
    availability: "High",
    cookingNotes: "Primary source of bioavailable calcium and Vitamin D.",
    description: "Whole cow milk boiled for breakfast or tea."
  },
  {
    id: "dairy-02",
    englishName: "Plain Unsweetened Yogurt (Tok Doi)",
    banglaName: "\u099F\u0995 \u09A6\u0987",
    category: "Dairy",
    foodGroup: "plain_yogurt_curd",
    semanticGroup: "plain_yogurt_curd",
    calories: 98,
    proteinGrams: 7,
    carbsGrams: 8,
    fatGrams: 4,
    fiberGrams: 0,
    servingSize: "1/2 cup",
    servingUnit: "150g fresh yogurt",
    preparationMethod: "Naturally fermented whole or cultured milk with no added sugar",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Dairy / Lactose"],
    availability: "High",
    cookingNotes: "Naturally fermented with live probiotic cultures and zero added sugar. Promotes healthy gut microbiome, active digestion, and metabolic health while providing bioavailable calcium.",
    description: "Traditional Bangladeshi plain unsweetened tart yogurt (Tok Doi), naturally fermented with no added sugar. Probiotic staple used in cooking, marinades, or consumed as a refreshing cooling side."
  },
  // 11. Nuts & Seeds
  {
    id: "nuts-01",
    englishName: "Peanut (Chinabadam)",
    banglaName: "\u099A\u09BF\u09A8\u09BE\u09AC\u09BE\u09A6\u09BE\u09AE",
    category: "Nuts & Seeds",
    calories: 165,
    proteinGrams: 7.2,
    carbsGrams: 4.5,
    fatGrams: 14,
    fiberGrams: 2.4,
    servingSize: "1 handful",
    servingUnit: "30g dry roasted",
    preparationMethod: "Dry roasted without oil",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Peanuts"],
    availability: "High",
    cookingNotes: "Healthy monounsaturated fats. Choose un-salted roasted peanuts.",
    description: "Affordable roasted groundnuts sold across street vendors and markets."
  },
  {
    id: "nuts-02",
    englishName: "Almond (Kathbadam)",
    banglaName: "\u0995\u09BE\u09A0\u09AC\u09BE\u09A6\u09BE\u09AE",
    category: "Nuts & Seeds",
    calories: 170,
    proteinGrams: 6,
    carbsGrams: 6,
    fatGrams: 14.5,
    fiberGrams: 3.5,
    servingSize: "1 hand (12\u201315 nuts)",
    servingUnit: "30g raw/soaked",
    preparationMethod: "Raw / Soaked overnight",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Tree Nuts"],
    availability: "High",
    cookingNotes: "Rich in Vitamin E antioxidant and heart-healthy magnesium.",
    description: "Nutrient-dense almonds eaten soaked or raw."
  },
  {
    id: "nuts-03",
    englishName: "Cashew (Kajubadam)",
    banglaName: "\u0995\u09BE\u099C\u09C1\u09AC\u09BE\u09A6\u09BE\u09AE",
    category: "Nuts & Seeds",
    calories: 160,
    proteinGrams: 5,
    carbsGrams: 9,
    fatGrams: 13,
    fiberGrams: 1,
    servingSize: "1 handful",
    servingUnit: "30g roasted",
    preparationMethod: "Lightly roasted",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Tree Nuts"],
    availability: "High",
    cookingNotes: "High zinc and copper content. Mind total quantity due to high caloric density.",
    description: "Creamy cashew nuts harvested in Chittagong hill tracts."
  },
  {
    id: "nuts-04",
    englishName: "Sesame Seed (Til)",
    banglaName: "\u09A4\u09BF\u09B2",
    category: "Nuts & Seeds",
    calories: 160,
    proteinGrams: 5,
    carbsGrams: 6.5,
    fatGrams: 13.5,
    fiberGrams: 3.2,
    servingSize: "2 tbsp",
    servingUnit: "28g seeds",
    preparationMethod: "Roasted / Til Naru component",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Sesame"],
    availability: "High",
    cookingNotes: "Exceptionally rich in bioavailable calcium and lignans.",
    description: "White or black sesame seeds used in traditional snacks."
  },
  {
    id: "nuts-05",
    englishName: "Pumpkin Seed (Kumrar Bichi)",
    banglaName: "\u0995\u09C1\u09AE\u09A1\u09BC\u09BE\u09B0 \u09AC\u09C0\u099C",
    category: "Nuts & Seeds",
    calories: 150,
    proteinGrams: 7,
    carbsGrams: 4,
    fatGrams: 13,
    fiberGrams: 1.8,
    servingSize: "2 tbsp",
    servingUnit: "28g dry roasted",
    preparationMethod: "Dry roasted",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Outstanding natural source of zinc and magnesium for immune health.",
    description: "Roasted pumpkin seeds rich in zinc and healthy fats."
  },
  {
    id: "nuts-06",
    englishName: "Flaxseed (Tisi Bichi)",
    banglaName: "\u09A4\u09BF\u09B8\u09BF \u09AC\u09C0\u099C",
    category: "Nuts & Seeds",
    calories: 150,
    proteinGrams: 5.2,
    carbsGrams: 8,
    fatGrams: 12,
    fiberGrams: 7.8,
    servingSize: "2 tbsp ground",
    servingUnit: "28g ground seeds",
    preparationMethod: "Lightly roasted & freshly ground",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "Medium",
    cookingNotes: "Highest plant source of Alpha-Linolenic Acid (ALA) Omega-3 fatty acid. Consume ground for full absorption.",
    description: "Traditional brown flaxseed consumed ground in water or bhorta."
  },
  {
    id: "nuts-07",
    englishName: "Chia Seed",
    banglaName: "\u099A\u09BF\u09AF\u09BC\u09BE \u09AC\u09C0\u099C",
    category: "Nuts & Seeds",
    calories: 73,
    proteinGrams: 2.5,
    carbsGrams: 6.3,
    fatGrams: 4.6,
    fiberGrams: 5.1,
    servingSize: "1 tbsp",
    servingUnit: "15g dry seeds",
    preparationMethod: "Soaked in water / mixed into yogurt, oats, or chira",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Dense source of plant ALA Omega-3 and soluble prebiotic mucilage fiber.",
    description: "Nutrient-dense chia seeds providing concentrated fiber and healthy omega fats."
  },
  {
    id: "nuts-08",
    englishName: "Sunflower Seed",
    banglaName: "\u09B8\u09C2\u09B0\u09CD\u09AF\u09AE\u09C1\u0996\u09C0 \u09AC\u09C0\u099C",
    category: "Nuts & Seeds",
    calories: 88,
    proteinGrams: 3.1,
    carbsGrams: 3,
    fatGrams: 7.7,
    fiberGrams: 1.4,
    servingSize: "1 tbsp",
    servingUnit: "15g dry roasted",
    preparationMethod: "Dry roasted without salt",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Loaded with Vitamin E, selenium, and phytosterols for cardiovascular protection.",
    description: "Lightly roasted sunflower kernels perfect as a nutritious salad or snack topping."
  },
  {
    id: "nuts-10",
    englishName: "Black-eyed Peas (Borboti Bichi)",
    banglaName: "\u09AC\u09B0\u09AC\u099F\u09BF \u09AC\u09BF\u099A\u09BF",
    category: "Nuts & Seeds",
    calories: 120,
    proteinGrams: 7,
    carbsGrams: 20,
    fatGrams: 0.7,
    fiberGrams: 4.8,
    servingSize: "1/2 cup",
    servingUnit: "100g cooked seeds",
    preparationMethod: "Boiled seeds eaten as a protein seed snack, salad topping, or vegetable side",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Nutrient-rich legume seeds packed with plant protein and fiber, eaten as a nutritious seed snack or side.",
    description: "Fresh cowpea seeds rich in minerals and slow-digesting dietary fiber."
  },
  // 12. Healthy Snacks
  {
    id: "snack-01",
    englishName: "Soybean",
    banglaName: "\u09B8\u09AF\u09BC\u09BE\u09AC\u09BF\u09A8",
    category: "Healthy Snacks",
    calories: 140,
    proteinGrams: 14,
    carbsGrams: 9,
    fatGrams: 6,
    fiberGrams: 5,
    servingSize: "1/2 cup",
    servingUnit: "90g boiled beans",
    preparationMethod: "Boiled / Light curry",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Soy"],
    availability: "High",
    cookingNotes: "Complete plant protein with all essential amino acids.",
    description: "High-protein soya beans boiled or cooked in vegetable curry."
  },
  {
    id: "snack-02",
    englishName: "Tofu",
    banglaName: "\u099F\u09CB\u09AB\u09C1",
    category: "Healthy Snacks",
    calories: 110,
    proteinGrams: 12,
    carbsGrams: 2.5,
    fatGrams: 6,
    fiberGrams: 1.2,
    servingSize: "1 cup cubes",
    servingUnit: "120g firm tofu",
    preparationMethod: "Pan-seared / Vegetable stew",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Soy"],
    availability: "Medium",
    cookingNotes: "Low carb, high protein soy curd.",
    description: "Firm bean curd versatile for healthy protein meals."
  },
  {
    id: "snack-03",
    englishName: "Roasted Chola / Gram",
    banglaName: "\u09AD\u09BE\u099C\u09BE \u099B\u09CB\u09B2\u09BE",
    category: "Healthy Snacks",
    calories: 180,
    proteinGrams: 9.5,
    carbsGrams: 28,
    fatGrams: 3,
    fiberGrams: 8.5,
    servingSize: "1/2 cup",
    servingUnit: "50g dry roasted",
    preparationMethod: "Dry roasted with skin intact, eaten with cucumber or lemon",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Exceptional slow-digesting complex carbs and high fiber for prolonged satiety.",
    description: "Crunchy dry-roasted Bengal gram with skin intact, high in protein and fiber."
  },
  {
    id: "snack-04",
    englishName: "Soy Milk / Plant Milk",
    banglaName: "\u09B8\u09AF\u09BC\u09BE\u09A6\u09C1\u09A7",
    category: "Healthy Snacks",
    calories: 80,
    proteinGrams: 7,
    carbsGrams: 4,
    fatGrams: 4,
    fiberGrams: 1.2,
    servingSize: "1 glass",
    servingUnit: "200ml unsweetened",
    preparationMethod: "Fresh unsweetened soy milk drink",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Soy"],
    availability: "High",
    cookingNotes: "Essential plant-based protein beverage for vegan breakfasts with oats or chira.",
    description: "Nutritious unsweetened soy milk providing high quality complete plant protein."
  },
  // 13. Traditional Bangladeshi Foods
  {
    id: "trad-01",
    englishName: "Khichuri",
    banglaName: "\u0996\u09BF\u099A\u09C1\u09A1\u09BC\u09BF",
    category: "Traditional Bangladeshi Foods",
    calories: 280,
    proteinGrams: 9.5,
    carbsGrams: 48,
    fatGrams: 6.5,
    fiberGrams: 4.5,
    servingSize: "1 bowl",
    servingUnit: "220g cooked",
    preparationMethod: "Boiled rice and lentils with spices",
    isVegetarian: true,
    isVegan: false,
    allergies: [],
    availability: "High",
    cookingNotes: "Classic comfort food pairing rice and lentils into a complete amino acid profile. Limit added ghee or oil.",
    description: "Traditional aromatic rice and lentil pot cooked during rainy days."
  },
  {
    id: "trad-02",
    englishName: "Vegetable Bhaji",
    banglaName: "\u09B8\u09AC\u099C\u09BF \u09AD\u09BE\u099C\u09BF",
    category: "Traditional Bangladeshi Foods",
    calories: 110,
    proteinGrams: 2.2,
    carbsGrams: 11,
    fatGrams: 6.8,
    fiberGrams: 3.2,
    servingSize: "1 bowl",
    servingUnit: "120g stir-fry",
    preparationMethod: "Stir fried in mustard oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Calories depend heavily on oil used during frying. Use 1 tsp oil per serving.",
    description: "Saut\xE9ed mixed seasonal vegetables cooked with cumin and green chillies."
  },
  {
    id: "trad-03",
    englishName: "Bhorta (Mashed Dish)",
    banglaName: "\u09AD\u09B0\u09CD\u09A4\u09BE",
    category: "Traditional Bangladeshi Foods",
    calories: 95,
    proteinGrams: 2.5,
    carbsGrams: 12,
    fatGrams: 4.5,
    fiberGrams: 2.8,
    servingSize: "2 tbsp",
    servingUnit: "60g mash (e.g., Aloo/Begun/Dal)",
    preparationMethod: "Boiled/Roasted then hand mashed with raw onion, chilli, mustard oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Authentic Bangladeshi comfort mash. Mustard oil provides pungent flavor and healthy monounsaturated fats.",
    description: "Hand-mashed vegetable, fish, or pulse mash flavoured with mustard oil."
  },
  {
    id: "trad-04",
    englishName: "Chira with Yogurt (Doi-Chira)",
    banglaName: "\u09A6\u0987-\u099A\u09BF\u09A1\u09BC\u09BE",
    category: "Traditional Bangladeshi Foods",
    calories: 220,
    proteinGrams: 8.5,
    carbsGrams: 38,
    fatGrams: 4,
    fiberGrams: 1.8,
    servingSize: "1 bowl",
    servingUnit: "200g prepared",
    preparationMethod: "Soaked flattened rice mixed with curd & banana",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Dairy / Lactose"],
    availability: "High",
    cookingNotes: "Gut-friendly summer cooling food. Use unsweetened curd and natural banana instead of added sugar.",
    description: "Refreshing traditional meal of soaked flattened rice with yogurt and banana."
  },
  {
    id: "trad-05",
    englishName: "Mixed Vegetable Curry",
    banglaName: "\u09AE\u09BF\u09B6\u09CD\u09B0 \u09B8\u09AC\u099C\u09BF \u09A4\u09B0\u0995\u09BE\u09B0\u09BF",
    category: "Traditional Bangladeshi Foods",
    calories: 90,
    proteinGrams: 2.5,
    carbsGrams: 12.5,
    fatGrams: 3.8,
    fiberGrams: 3.5,
    servingSize: "1 bowl",
    servingUnit: "150g stew",
    preparationMethod: "Lightly spiced simmered stew",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "High volume, micronutrient-dense meal component.",
    description: "Assorted seasonal vegetables stewed with turmeric, ginger, and panch phoron."
  },
  // 14. Oils & Fats
  {
    id: "oil-01",
    englishName: "Mustard Oil (Shorishar Tel)",
    banglaName: "\u09B8\u09B0\u09BF\u09B7\u09BE\u09B0 \u09A4\u09C7\u09B2",
    category: "Oils & Fats",
    calories: 120,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 14,
    fiberGrams: 0,
    servingSize: "1 tbsp",
    servingUnit: "14g oil",
    preparationMethod: "Cold pressed cooking oil",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Mustard"],
    availability: "High",
    cookingNotes: "Traditional Bangladeshi cooking medium rich in MUFA/PUFA. High calorie density \u2014 measure by spoon.",
    description: "Pungent cold-pressed mustard seed oil used across Bangladeshi cuisine."
  },
  {
    id: "oil-02",
    englishName: "Ghee (Clarified Butter)",
    banglaName: "\u0998\u09BF",
    category: "Oils & Fats",
    calories: 112,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 12.7,
    fiberGrams: 0,
    servingSize: "1 tbsp",
    servingUnit: "13g ghee",
    preparationMethod: "Clarified butter fat",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Dairy / Lactose"],
    availability: "High",
    cookingNotes: "High smoke point and rich aroma. Saturated fat source \u2014 consume sparingly for flavor.",
    description: "Aromatic pure deshi clarified butter fat."
  },
  {
    id: "oil-04",
    englishName: "Soybean Oil",
    banglaName: "\u09B8\u09AF\u09BC\u09BE\u09AC\u09BF\u09A8 \u09A4\u09C7\u09B2",
    category: "Oils & Fats",
    calories: 120,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 13.6,
    fiberGrams: 0,
    servingSize: "1 tbsp",
    servingUnit: "14g oil",
    preparationMethod: "Refined vegetable cooking oil",
    isVegetarian: true,
    isVegan: true,
    allergies: ["Soy"],
    availability: "High",
    cookingNotes: "Standard neutral cooking oil widely used in Bangladeshi households for cooking curries and saut\xE9ing. High energy density.",
    description: "Refined vegetable oil used as everyday cooking medium across Bangladesh."
  },
  {
    id: "oil-05",
    englishName: "Olive Oil",
    banglaName: "\u0985\u09B2\u09BF\u09AD \u09A4\u09C7\u09B2",
    category: "Oils & Fats",
    calories: 119,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 13.5,
    fiberGrams: 0,
    servingSize: "1 tbsp",
    servingUnit: "14g oil",
    preparationMethod: "Cold-pressed extra virgin or pure cooking olive oil",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in monounsaturated oleic acid and polyphenols. Excellent for heart health, light saut\xE9ing, or salad dressing.",
    description: "Heart-healthy cold-pressed olive oil rich in monounsaturated fats and antioxidants."
  },
  // 15. Beverages
  {
    id: "bev-01",
    englishName: "Green Tea",
    banglaName: "\u0997\u09CD\u09B0\u09BF\u09A8 \u099F\u09BF",
    category: "Beverages",
    calories: 2,
    proteinGrams: 0,
    carbsGrams: 0.2,
    fatGrams: 0,
    fiberGrams: 0,
    servingSize: "1 cup",
    servingUnit: "150ml brewed tea",
    preparationMethod: "Steeped green tea leaves without sugar",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Rich in EGCG epigallocatechin gallate antioxidant for metabolic health.",
    description: "Srimangal Bangladeshi green tea brewed fresh without sugar."
  },
  {
    id: "bev-02",
    englishName: "Matha / Laban",
    banglaName: "\u09AE\u09BE\u09A0\u09BE / \u09B2\u09BE\u09AC\u09BE\u09A8",
    category: "Beverages",
    calories: 70,
    proteinGrams: 3.5,
    carbsGrams: 6,
    fatGrams: 3.2,
    fiberGrams: 0,
    servingSize: "1 glass",
    servingUnit: "200ml drink",
    preparationMethod: "Churned spiced buttermilk",
    isVegetarian: true,
    isVegan: false,
    allergies: ["Dairy / Lactose"],
    availability: "High",
    cookingNotes: "Refreshing probiotic churned buttermilk drink with toasted cumin and rock salt.",
    description: "Traditional Bangladeshi spiced buttermilk beverage."
  },
  {
    id: "bev-03",
    englishName: "Lemon Water (Lebu Pani)",
    banglaName: "\u09B2\u09C7\u09AC\u09C1 \u09AA\u09BE\u09A8\u09BF",
    category: "Beverages",
    calories: 12,
    proteinGrams: 0.2,
    carbsGrams: 3,
    fatGrams: 0,
    fiberGrams: 0.2,
    servingSize: "1 glass",
    servingUnit: "250ml water with fresh lemon",
    preparationMethod: "Squeezed fresh lemon in water (unsweetened)",
    isVegetarian: true,
    isVegan: true,
    allergies: [],
    availability: "High",
    cookingNotes: "Hydrating Vitamin C drink. Avoid adding refined white sugar.",
    description: "Freshly squeezed Bangladeshi Pati Lebu water without added sugar."
  }
];
var BANGLADESH_FOOD_DATABASE = RAW_BANGLADESH_FOOD_DATABASE.map(enrichFoodItem);
var SAMPLE_BANGLADESH_FOODS = BANGLADESH_FOOD_DATABASE;

// src/server/nutritionAIHandler.ts
var NUTRIGUIDE_MASTER_SYSTEM_PROMPT = `You are NutriGuide, a careful nutrition assistant for a Bangladeshi food and meal-planning application.

Your job is to help users with:

* Bangladeshi breakfast
* Bangladeshi lunch
* Bangladeshi dinner
* snacks
* food substitutions
* food nutrition
* calories
* protein
* healthy eating
* weight-management meal suggestions
* meal plans
* dietary preferences
* food restrictions and allergies

## Core conversation rule

Treat the conversation as continuous.

A user's current message may depend on information they stated earlier.

For example:

User:
"I am vegetarian. Give me lunch ideas."

Then:
"I don't eat rice."

Then:
"What about eggs?"

Then:
"Give me three."

You must understand that the later messages modify the previous request.

Do not reset the user's restrictions on every message.

---

## Dietary restrictions

Respect explicit dietary restrictions from the current conversation and the user's stored Health Profile.

Examples:

* vegetarian \u2192 do not recommend meat or fish
* vegan \u2192 do not recommend meat, fish, eggs, dairy, or other animal products
* pescatarian \u2192 fish/seafood may be recommended, but meat and poultry must not be recommended
* no rice \u2192 do not recommend rice or rice-based substitutes when the user means completely rice-free
* no eggs \u2192 do not recommend eggs
* no fish \u2192 do not recommend fish
* no meat \u2192 do not recommend meat or poultry
* allergies \u2192 never knowingly recommend the allergen

A newly stated restriction should update the conversation state.

A newly stated preference can override an earlier preference when the user clearly changes their mind.

Example:

"I don't eat fish."

Later:

"Actually, I eat fish."

The latest explicit statement should be treated as the current preference.

Do NOT call the user contradictory merely because their preference changed.

---

## Vegetarian clarification

If the user says they are vegetarian and then asks for fish, explain briefly that fish is not vegetarian.

Do not silently provide fish.

However, if the user clearly says they now eat fish and avoid meat, treat the user as pescatarian rather than vegetarian.

---

## Food recommendations

Recommendations should be practical and culturally appropriate for Bangladesh.

Prefer foods available in the application's Bangladesh food database when relevant.

Do not invent nutritional database values.

If exact calories or protein are requested and the database value is unavailable, clearly say that the exact value depends on serving size/preparation rather than inventing a number.

---

## Meal recommendations

When the user asks for a meal, give a practical meal rather than a long lecture.

Example structure:

"Here is a suitable vegetarian Bangladeshi lunch:

\u2022 2 small atta rotis
\u2022 1 bowl of masoor dal
\u2022 1 bowl of seasonal vegetables
\u2022 cucumber and tomato salad"

Adapt the meal to the user's restrictions.

Do not include forbidden foods merely as optional alternatives.

---

## Exact number requests

If the user asks for a specific number, respect the number.

Examples:

"Give me 3 lunch ideas." \u2192 give exactly 3.

"Give me 5 breakfasts." \u2192 give exactly 5.

Do not give 10 when the user asked for 3.

Do not claim that you provided a requested number if you did not.

---

## Follow-up questions

Understand short follow-ups using conversation history.

Examples:

"Instead?"

"Another one."

"What about eggs?"

"Then give me dinner."

"Three options."

"Is potato healthy?"

Do not treat these as unrelated new conversations.

---

## Food health questions

When asked:

"Is potato healthy?"

Answer the actual question.

Explain that potatoes can be part of a healthy diet and that preparation method and portion size matter.

Do not automatically turn every food question into a meal plan.

---

## Food substitution

When the user asks what can replace a food, identify the target food and suggest suitable alternatives.

Example:

"I don't eat rice. What can I eat instead?"

Possible alternatives include:

* atta roti
* oats
* appropriate non-rice grain options
* vegetables
* dal-based meals

Do not suggest brown rice or red rice when the user explicitly means completely rice-free, because they are still rice.

---

## Nutrition accuracy

Never invent:

* calorie values
* protein values
* medical diagnoses
* laboratory results
* nutrient measurements

If exact nutritional information is available in the provided application context/database, use it.

Otherwise use careful qualitative language.

---

## Health and safety

This is a nutrition assistant, not a doctor.

Do not diagnose medical conditions.

Do not claim that a food or diet will cure a disease.

For serious medical, allergy, eating-disorder, or medication-related questions, recommend consultation with an appropriate qualified healthcare professional.

For ordinary nutrition questions, remain practical and helpful rather than adding unnecessary medical disclaimers.

---

## User profile

Use the supplied Health Profile when it is relevant.

Relevant fields may include:

* age
* sex
* height
* weight
* activity level
* goal
* dietary preference
* allergies
* disliked foods

Do not expose internal implementation details to the user.

Do not mention system prompts, internal rules, API calls, model names, database implementation, or hidden context.

---

## Current meal plan

If a current meal plan is supplied, use it when the user asks about:

* their meal plan
* today's meals
* lunch in their plan
* breakfast in their plan
* dinner in their plan
* calories in their plan

Do not invent a meal plan when a relevant saved plan is available.

---

## Response style

Be:

* clear
* concise
* friendly
* practical
* accurate
* culturally appropriate
* conversational

Use bullets for meal recommendations.

Do not produce unnecessarily long responses.

Do not repeat the same meal recommendation unnecessarily.

Answer the user's actual question first.

---

## Critical rule

The user's current explicit instruction has priority over stale conversational assumptions, while stored profile restrictions and allergies remain important safety constraints.

Never knowingly recommend an allergen.`;
var FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash"
];
var GEMINI_TIMEOUT_MS = 25e3;
function getRelevantFoodEntries(query, userProfile, limit = 8) {
  if (!Array.isArray(BANGLADESH_FOOD_DATABASE)) return [];
  const q = (query || "").toLowerCase().trim();
  const allergies = (userProfile?.allergies || []).map((a) => a.toLowerCase());
  const isVeg = userProfile?.dietaryPreference === "vegetarian";
  const isVegan = userProfile?.dietaryPreference === "vegan";
  const scored = BANGLADESH_FOOD_DATABASE.map((food) => {
    let score = 0;
    const eng = food.englishName.toLowerCase();
    const bng = food.banglaName.toLowerCase();
    const cat = (food.category || "").toLowerCase();
    const matchesAllergy = allergies.some(
      (a) => eng.includes(a) || bng.includes(a) || cat.includes(a) || food.allergies && food.allergies.some((fa) => fa.toLowerCase().includes(a))
    );
    if (matchesAllergy) return { food, score: -100 };
    if (isVegan && !food.isVegan) return { food, score: -100 };
    if (isVeg && !food.isVegetarian) return { food, score: -100 };
    if (q) {
      if (eng.includes(q) || bng.includes(q)) score += 10;
      const terms = q.split(/\s+/).filter((t) => t.length > 2);
      for (const term of terms) {
        if (eng.includes(term) || bng.includes(term)) score += 5;
        if (cat.includes(term)) score += 3;
      }
    }
    if (food.breakfastSuitable && (q.includes("breakfast") || q.includes("shokal") || q.includes("morning"))) score += 4;
    if (food.lunchSuitable && (q.includes("lunch") || q.includes("dupur") || q.includes("midday"))) score += 4;
    if (food.dinnerSuitable && (q.includes("dinner") || q.includes("raat") || q.includes("night"))) score += 4;
    if (food.snackSuitable && (q.includes("snack") || q.includes("nasta") || q.includes("bikal"))) score += 4;
    return { food, score };
  });
  return scored.filter((item) => item.score >= 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.food);
}
function validateResponseSafety(responseText, userProfile, currentPrompt) {
  if (!responseText || typeof responseText !== "string") return responseText;
  const profile = userProfile;
  const allergies = (profile?.allergies || []).map((a) => a.toLowerCase());
  const isVeg = profile?.dietaryPreference === "vegetarian";
  const isVegan = profile?.dietaryPreference === "vegan";
  const lines = responseText.split("\n");
  let hasViolation = false;
  const forbiddenTerms = [...allergies];
  if (isVeg) forbiddenTerms.push("meat", "beef", "chicken", "mutton", "fish", "prawn", "shrimp");
  if (isVegan) forbiddenTerms.push("meat", "beef", "chicken", "mutton", "fish", "egg", "milk", "yogurt", "curd", "doi", "paneer", "cheese", "ghee", "butter");
  for (const line of lines) {
    const trimmed = line.trim();
    const isBulletOrList = /^([•\-*]|\d+\.)\s+/i.test(trimmed);
    const isRecommendationPhrase = /\b(try|eat|have|suggest|recommend|include|take)\s+/i.test(trimmed);
    if (isBulletOrList || isRecommendationPhrase) {
      const lower = trimmed.toLowerCase();
      for (const term of forbiddenTerms) {
        if (!term) continue;
        const reg = new RegExp(`\\b${term}\\b`, "i");
        if (reg.test(lower)) {
          if (!lower.includes("avoid") && !lower.includes("do not") && !lower.includes("don't") && !lower.includes("free of")) {
            hasViolation = true;
            break;
          }
        }
      }
    }
    if (hasViolation) break;
  }
  if (hasViolation) {
    console.warn("[NutriGuide Safety] AI response contained a restricted food recommendation. Sanitizing response.");
    if (isVeg || isVegan) {
      return [
        "Here is a healthy plant-based Bangladeshi recommendation tailored to your preferences:",
        "",
        "\u2022 2 small whole-wheat atta rotis",
        "\u2022 1 bowl of thick masoor or moong dal",
        "\u2022 1 bowl of seasonal vegetable curry (lau, potol, or palong shak)",
        "\u2022 Fresh cucumber and tomato salad with a squeeze of fresh lemon",
        "",
        "This meal is balanced, rich in plant protein and dietary fiber, and cooked with minimal oil."
      ].join("\n");
    }
  }
  return responseText;
}
function buildAIRequestContext(options) {
  const { userProfile, nutritionCalculations, currentMealPlan, foodDatabaseContext, activeContext } = options;
  const relevantFoods = foodDatabaseContext && foodDatabaseContext.length > 0 ? foodDatabaseContext : getRelevantFoodEntries(options.prompt, userProfile, 8);
  const contextData = {
    profile: userProfile ? {
      name: userProfile.name,
      age: userProfile.age,
      sex: userProfile.sex,
      heightCm: userProfile.heightCm,
      weightKg: userProfile.weightKg,
      activityLevel: userProfile.activityLevel,
      goal: userProfile.goal,
      dietaryPreference: userProfile.dietaryPreference,
      allergies: userProfile.allergies || [],
      dislikedFoods: userProfile.dislikedFoods || []
    } : null,
    metrics: nutritionCalculations ? {
      bmi: nutritionCalculations.bmi,
      bmiCategory: nutritionCalculations.bmiCategory,
      bmrKcal: nutritionCalculations.bmrKcal,
      tdeeKcal: nutritionCalculations.dailyEnergyNeedsKcal,
      macros: nutritionCalculations.macros
    } : null,
    currentMealPlan: currentMealPlan ? {
      targetTotalCalories: currentMealPlan.targetTotalCalories,
      actualTotalCalories: currentMealPlan.actualTotalCalories,
      meals: currentMealPlan.meals?.map((m) => ({
        type: m.type,
        title: m.title,
        calories: m.totalCalories,
        items: m.items?.map((i) => ({
          name: `${i.foodItem.banglaName} (${i.foodItem.englishName})`,
          portion: i.servingText,
          calories: i.calories
        }))
      }))
    } : null,
    relevantBangladeshFoodDatabaseItems: relevantFoods.map((f) => ({
      banglaName: f.banglaName,
      englishName: f.englishName,
      category: f.category,
      caloriesPerServing: f.calories,
      proteinGrams: f.proteinGrams,
      carbsGrams: f.carbsGrams,
      fatGrams: f.fatGrams,
      isVegetarian: f.isVegetarian,
      isVegan: f.isVegan
    })),
    activePageContext: activeContext || "General NutriGuide Chat"
  };
  return contextData;
}
async function executeNutriGuideChat(ai, options) {
  const { prompt, chatHistory, userProfile } = options;
  const contextData = buildAIRequestContext(options);
  const recentHistory = Array.isArray(chatHistory) ? chatHistory.slice(-8) : [];
  const formattedHistoryText = recentHistory.length > 0 ? recentHistory.map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") : "";
  const userPromptWithContext = `STRUCTURED APPLICATION CONTEXT:
${JSON.stringify(contextData, null, 2)}

${formattedHistoryText ? `RECENT CONVERSATION HISTORY:
${formattedHistoryText}

` : ""}CURRENT USER MESSAGE:
${prompt}`;
  const timeoutPromise = new Promise(
    (_, reject) => setTimeout(() => reject(new Error(`AI Assistant request timed out after ${GEMINI_TIMEOUT_MS}ms`)), GEMINI_TIMEOUT_MS)
  );
  const requestPromise = (async () => {
    let lastError = null;
    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: userPromptWithContext }] }],
          config: {
            systemInstruction: NUTRIGUIDE_MASTER_SYSTEM_PROMPT,
            temperature: 0.7,
            topP: 0.9
          }
        });
        const rawText = response?.text?.trim();
        if (rawText) {
          const sanitized = validateResponseSafety(rawText, userProfile, prompt);
          return { text: sanitized, modelUsed: modelName };
        }
      } catch (err) {
        lastError = err;
        console.warn(`[NutriGuide AI] Model ${modelName} returned error (${err?.message || err}). Trying next model in pool...`);
      }
    }
    throw lastError || new Error("All configured AI models were unable to generate a response.");
  })();
  return Promise.race([requestPromise, timeoutPromise]);
}

// src/server/app.ts
function createExpressApp() {
  const app2 = express();
  app2.use(express.json());
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      appName: "Nutri Guide",
      targetRegion: "Bangladesh",
      version: "2.0.0-clean-backend",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/food-database/sample", (req, res) => {
    res.json({
      success: true,
      count: SAMPLE_BANGLADESH_FOODS.length,
      items: SAMPLE_BANGLADESH_FOODS
    });
  });
  app2.post("/api/ai/nutrition-assistant", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: "Gemini API key is not configured in server environment settings.",
          isConfigured: false
        });
      }
      const {
        prompt,
        userProfile,
        nutritionCalculations,
        currentMealPlan,
        foodDatabaseContext,
        activeContext,
        chatHistory
      } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: "A valid user message prompt is required."
        });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const chatResult = await executeNutriGuideChat(ai, {
        prompt: prompt.trim(),
        userProfile,
        nutritionCalculations,
        currentMealPlan,
        foodDatabaseContext,
        activeContext,
        chatHistory
      });
      return res.json({
        success: true,
        answer: chatResult.text,
        modelUsed: chatResult.modelUsed
      });
    } catch (err) {
      console.error("[NutriGuide API Error]", err);
      let errorMessage = "The nutrition assistant is momentarily unavailable. Please try again shortly.";
      const rawMsg = String(err?.message || err || "");
      if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota")) {
        errorMessage = "The AI service is currently experiencing high demand or rate limits. Please try again in a few moments.";
      } else if (rawMsg.includes("timed out")) {
        errorMessage = "The request took too long to complete. Please try again.";
      } else if (rawMsg && !rawMsg.startsWith("{") && !rawMsg.includes('"code":')) {
        errorMessage = rawMsg;
      }
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });
  return app2;
}

// src/server/vercelEntry.ts
var app = createExpressApp();
var vercelEntry_default = app;
export {
  vercelEntry_default as default
};
