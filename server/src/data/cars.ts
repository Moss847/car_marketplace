export const carBrands = [
  {
    id: "VAZ",
    name: "Lada (ВАЗ)",
    "cyrillic-name": "Лада",
    popular: true,
    country: "Россия",
    models: [
      {
        id: "VAZ_1111",
        name: "1111 Ока",
        "cyrillic-name": "Ока",
        class: "A",
        "year-from": 1987,
        "year-to": 2008,
        path: {
          "mark-id": "VAZ"
        }
      }
    ]
  }
];

export const getBrandName = (brandId: string): string => {
  const brand = carBrands.find(b => b.id === brandId);
  return brand ? brand.name : brandId;
};

export const getModelName = (brandId: string, modelId: string): string => {
  const brand = carBrands.find(b => b.id === brandId);
  if (!brand) return modelId;
  
  const model = brand.models.find(m => m.id === modelId);
  return model ? model.name : modelId;
}; 