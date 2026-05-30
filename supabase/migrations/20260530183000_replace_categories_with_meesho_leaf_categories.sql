-- Replace the original broad shop categories with the Meesho-style leaf categories used by the admin picker.
BEGIN;

CREATE TEMP TABLE meesho_category_seed (
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL
) ON COMMIT DROP;

INSERT INTO meesho_category_seed (name, slug, description, sort_order) VALUES
  ('Silk Sarees','women-fashion-ethnic-wear-sarees-silk-sarees','Women Fashion / Ethnic Wear / Sarees / Silk Sarees',1),
  ('Cotton Sarees','women-fashion-ethnic-wear-sarees-cotton-sarees','Women Fashion / Ethnic Wear / Sarees / Cotton Sarees',2),
  ('Chiffon Sarees','women-fashion-ethnic-wear-sarees-chiffon-sarees','Women Fashion / Ethnic Wear / Sarees / Chiffon Sarees',3),
  ('Georgette Sarees','women-fashion-ethnic-wear-sarees-georgette-sarees','Women Fashion / Ethnic Wear / Sarees / Georgette Sarees',4),
  ('Anarkali Kurtis','women-fashion-ethnic-wear-kurtis-anarkali-kurtis','Women Fashion / Ethnic Wear / Kurtis / Anarkali Kurtis',5),
  ('Straight Kurtis','women-fashion-ethnic-wear-kurtis-straight-kurtis','Women Fashion / Ethnic Wear / Kurtis / Straight Kurtis',6),
  ('A-Line Kurtis','women-fashion-ethnic-wear-kurtis-a-line-kurtis','Women Fashion / Ethnic Wear / Kurtis / A-Line Kurtis',7),
  ('Printed Kurtis','women-fashion-ethnic-wear-kurtis-printed-kurtis','Women Fashion / Ethnic Wear / Kurtis / Printed Kurtis',8),
  ('Kurta Palazzo Sets','women-fashion-ethnic-wear-kurta-sets-kurta-palazzo-sets','Women Fashion / Ethnic Wear / Kurta Sets / Kurta Palazzo Sets',9),
  ('Kurta Pant Sets','women-fashion-ethnic-wear-kurta-sets-kurta-pant-sets','Women Fashion / Ethnic Wear / Kurta Sets / Kurta Pant Sets',10),
  ('Kurta Dupatta Sets','women-fashion-ethnic-wear-kurta-sets-kurta-dupatta-sets','Women Fashion / Ethnic Wear / Kurta Sets / Kurta Dupatta Sets',11),
  ('Bridal Lehengas','women-fashion-ethnic-wear-lehengas-bridal-lehengas','Women Fashion / Ethnic Wear / Lehengas / Bridal Lehengas',12),
  ('Party Wear Lehengas','women-fashion-ethnic-wear-lehengas-party-wear-lehengas','Women Fashion / Ethnic Wear / Lehengas / Party Wear Lehengas',13),
  ('Lehenga Cholis','women-fashion-ethnic-wear-lehengas-lehenga-cholis','Women Fashion / Ethnic Wear / Lehengas / Lehenga Cholis',14),
  ('Casual Tops','women-fashion-western-wear-tops-casual-tops','Women Fashion / Western Wear / Tops / Casual Tops',15),
  ('Crop Tops','women-fashion-western-wear-tops-crop-tops','Women Fashion / Western Wear / Tops / Crop Tops',16),
  ('Shirts','women-fashion-western-wear-tops-shirts','Women Fashion / Western Wear / Tops / Shirts',17),
  ('Tunics','women-fashion-western-wear-tops-tunics','Women Fashion / Western Wear / Tops / Tunics',18),
  ('Maxi Dresses','women-fashion-western-wear-dresses-maxi-dresses','Women Fashion / Western Wear / Dresses / Maxi Dresses',19),
  ('Midi Dresses','women-fashion-western-wear-dresses-midi-dresses','Women Fashion / Western Wear / Dresses / Midi Dresses',20),
  ('Bodycon Dresses','women-fashion-western-wear-dresses-bodycon-dresses','Women Fashion / Western Wear / Dresses / Bodycon Dresses',21),
  ('Gowns','women-fashion-western-wear-dresses-gowns','Women Fashion / Western Wear / Dresses / Gowns',22),
  ('Jeans','women-fashion-western-wear-bottomwear-jeans','Women Fashion / Western Wear / Bottomwear / Jeans',23),
  ('Trousers','women-fashion-western-wear-bottomwear-trousers','Women Fashion / Western Wear / Bottomwear / Trousers',24),
  ('Skirts','women-fashion-western-wear-bottomwear-skirts','Women Fashion / Western Wear / Bottomwear / Skirts',25),
  ('Shorts','women-fashion-western-wear-bottomwear-shorts','Women Fashion / Western Wear / Bottomwear / Shorts',26),
  ('Earrings','women-fashion-jewellery-and-accessories-jewellery-earrings','Women Fashion / Jewellery & Accessories / Jewellery / Earrings',27),
  ('Necklaces','women-fashion-jewellery-and-accessories-jewellery-necklaces','Women Fashion / Jewellery & Accessories / Jewellery / Necklaces',28),
  ('Bangles','women-fashion-jewellery-and-accessories-jewellery-bangles','Women Fashion / Jewellery & Accessories / Jewellery / Bangles',29),
  ('Rings','women-fashion-jewellery-and-accessories-jewellery-rings','Women Fashion / Jewellery & Accessories / Jewellery / Rings',30),
  ('Handbags','women-fashion-jewellery-and-accessories-bags-handbags','Women Fashion / Jewellery & Accessories / Bags / Handbags',31),
  ('Sling Bags','women-fashion-jewellery-and-accessories-bags-sling-bags','Women Fashion / Jewellery & Accessories / Bags / Sling Bags',32),
  ('Wallets','women-fashion-jewellery-and-accessories-bags-wallets','Women Fashion / Jewellery & Accessories / Bags / Wallets',33),
  ('Clutches','women-fashion-jewellery-and-accessories-bags-clutches','Women Fashion / Jewellery & Accessories / Bags / Clutches',34),
  ('T-Shirts','men-fashion-mens-clothing-top-wear-t-shirts','Men Fashion / Mens Clothing / Top Wear / T-Shirts',35),
  ('Casual Shirts','men-fashion-mens-clothing-top-wear-casual-shirts','Men Fashion / Mens Clothing / Top Wear / Casual Shirts',36),
  ('Formal Shirts','men-fashion-mens-clothing-top-wear-formal-shirts','Men Fashion / Mens Clothing / Top Wear / Formal Shirts',37),
  ('Kurtas','men-fashion-mens-clothing-top-wear-kurtas','Men Fashion / Mens Clothing / Top Wear / Kurtas',38),
  ('Jeans','men-fashion-mens-clothing-bottom-wear-jeans','Men Fashion / Mens Clothing / Bottom Wear / Jeans',39),
  ('Trousers','men-fashion-mens-clothing-bottom-wear-trousers','Men Fashion / Mens Clothing / Bottom Wear / Trousers',40),
  ('Shorts','men-fashion-mens-clothing-bottom-wear-shorts','Men Fashion / Mens Clothing / Bottom Wear / Shorts',41),
  ('Track Pants','men-fashion-mens-clothing-bottom-wear-track-pants','Men Fashion / Mens Clothing / Bottom Wear / Track Pants',42),
  ('Vests','men-fashion-mens-clothing-inner-and-sleep-wear-vests','Men Fashion / Mens Clothing / Inner & Sleep Wear / Vests',43),
  ('Boxers','men-fashion-mens-clothing-inner-and-sleep-wear-boxers','Men Fashion / Mens Clothing / Inner & Sleep Wear / Boxers',44),
  ('Briefs','men-fashion-mens-clothing-inner-and-sleep-wear-briefs','Men Fashion / Mens Clothing / Inner & Sleep Wear / Briefs',45),
  ('Night Suits','men-fashion-mens-clothing-inner-and-sleep-wear-night-suits','Men Fashion / Mens Clothing / Inner & Sleep Wear / Night Suits',46),
  ('Casual Shirts','men-fashion-top-wear-shirts-casual-shirts','Men Fashion / Top Wear / Shirts / Casual Shirts',47),
  ('Formal Shirts','men-fashion-top-wear-shirts-formal-shirts','Men Fashion / Top Wear / Shirts / Formal Shirts',48),
  ('Printed Shirts','men-fashion-top-wear-shirts-printed-shirts','Men Fashion / Top Wear / Shirts / Printed Shirts',49),
  ('Round Neck T-Shirts','men-fashion-top-wear-t-shirts-round-neck-t-shirts','Men Fashion / Top Wear / T-Shirts / Round Neck T-Shirts',50),
  ('Polo T-Shirts','men-fashion-top-wear-t-shirts-polo-t-shirts','Men Fashion / Top Wear / T-Shirts / Polo T-Shirts',51),
  ('Graphic T-Shirts','men-fashion-top-wear-t-shirts-graphic-t-shirts','Men Fashion / Top Wear / T-Shirts / Graphic T-Shirts',52),
  ('Cotton Kurtas','men-fashion-top-wear-kurtas-cotton-kurtas','Men Fashion / Top Wear / Kurtas / Cotton Kurtas',53),
  ('Festive Kurtas','men-fashion-top-wear-kurtas-festive-kurtas','Men Fashion / Top Wear / Kurtas / Festive Kurtas',54),
  ('Kurta Sets','men-fashion-top-wear-kurtas-kurta-sets','Men Fashion / Top Wear / Kurtas / Kurta Sets',55),
  ('Slim Fit Jeans','men-fashion-bottom-wear-jeans-slim-fit-jeans','Men Fashion / Bottom Wear / Jeans / Slim Fit Jeans',56),
  ('Regular Fit Jeans','men-fashion-bottom-wear-jeans-regular-fit-jeans','Men Fashion / Bottom Wear / Jeans / Regular Fit Jeans',57),
  ('Denim Joggers','men-fashion-bottom-wear-jeans-denim-joggers','Men Fashion / Bottom Wear / Jeans / Denim Joggers',58),
  ('Formal Trousers','men-fashion-bottom-wear-trousers-formal-trousers','Men Fashion / Bottom Wear / Trousers / Formal Trousers',59),
  ('Casual Trousers','men-fashion-bottom-wear-trousers-casual-trousers','Men Fashion / Bottom Wear / Trousers / Casual Trousers',60),
  ('Chinos','men-fashion-bottom-wear-trousers-chinos','Men Fashion / Bottom Wear / Trousers / Chinos',61),
  ('Cotton Shorts','men-fashion-bottom-wear-shorts-cotton-shorts','Men Fashion / Bottom Wear / Shorts / Cotton Shorts',62),
  ('Denim Shorts','men-fashion-bottom-wear-shorts-denim-shorts','Men Fashion / Bottom Wear / Shorts / Denim Shorts',63),
  ('Sports Shorts','men-fashion-bottom-wear-shorts-sports-shorts','Men Fashion / Bottom Wear / Shorts / Sports Shorts',64),
  ('Sliders','men-fashion-footwear-flipflops-and-slippers-sliders','Men Fashion / Footwear / Flipflops & Slippers / Sliders',65),
  ('Clogs','men-fashion-footwear-flipflops-and-slippers-clogs','Men Fashion / Footwear / Flipflops & Slippers / Clogs',66),
  ('Casual Shoes','men-fashion-footwear-shoes-casual-shoes','Men Fashion / Footwear / Shoes / Casual Shoes',67),
  ('Formal Shoes','men-fashion-footwear-shoes-formal-shoes','Men Fashion / Footwear / Shoes / Formal Shoes',68),
  ('Sports Shoes','men-fashion-footwear-shoes-sports-shoes','Men Fashion / Footwear / Shoes / Sports Shoes',69),
  ('Sandals','men-fashion-footwear-sandals-and-floaters-sandals','Men Fashion / Footwear / Sandals & Floaters / Sandals',70),
  ('Floaters','men-fashion-footwear-sandals-and-floaters-floaters','Men Fashion / Footwear / Sandals & Floaters / Floaters',71),
  ('Flip Flops','men-fashion-footwear-sandals-and-floaters-flip-flops','Men Fashion / Footwear / Sandals & Floaters / Flip Flops',72),
  ('Mojaris','men-fashion-footwear-ethnic-footwear-mojaris','Men Fashion / Footwear / Ethnic Footwear / Mojaris',73),
  ('Kolhapuris','men-fashion-footwear-ethnic-footwear-kolhapuris','Men Fashion / Footwear / Ethnic Footwear / Kolhapuris',74),
  ('Juttis','men-fashion-footwear-ethnic-footwear-juttis','Men Fashion / Footwear / Ethnic Footwear / Juttis',75),
  ('Socks','men-fashion-footwear-shoe-accessories-socks','Men Fashion / Footwear / Shoe Accessories / Socks',76),
  ('Insoles','men-fashion-footwear-shoe-accessories-insoles','Men Fashion / Footwear / Shoe Accessories / Insoles',77),
  ('Shoe Care','men-fashion-footwear-shoe-accessories-shoe-care','Men Fashion / Footwear / Shoe Accessories / Shoe Care',78),
  ('Leather Wallets','men-fashion-accessories-wallets-leather-wallets','Men Fashion / Accessories / Wallets / Leather Wallets',79),
  ('Card Holders','men-fashion-accessories-wallets-card-holders','Men Fashion / Accessories / Wallets / Card Holders',80),
  ('Formal Belts','men-fashion-accessories-belts-formal-belts','Men Fashion / Accessories / Belts / Formal Belts',81),
  ('Casual Belts','men-fashion-accessories-belts-casual-belts','Men Fashion / Accessories / Belts / Casual Belts',82),
  ('Analog Watches','men-fashion-accessories-watches-analog-watches','Men Fashion / Accessories / Watches / Analog Watches',83),
  ('Smart Watches','men-fashion-accessories-watches-smart-watches','Men Fashion / Accessories / Watches / Smart Watches',84),
  ('Double Bedsheets','home-and-living-home-furnishing-bedsheets-double-bedsheets','Home & Living / Home Furnishing / Bedsheets / Double Bedsheets',85),
  ('Single Bedsheets','home-and-living-home-furnishing-bedsheets-single-bedsheets','Home & Living / Home Furnishing / Bedsheets / Single Bedsheets',86),
  ('Fitted Bedsheets','home-and-living-home-furnishing-bedsheets-fitted-bedsheets','Home & Living / Home Furnishing / Bedsheets / Fitted Bedsheets',87),
  ('Door Curtains','home-and-living-home-furnishing-curtains-door-curtains','Home & Living / Home Furnishing / Curtains / Door Curtains',88),
  ('Window Curtains','home-and-living-home-furnishing-curtains-window-curtains','Home & Living / Home Furnishing / Curtains / Window Curtains',89),
  ('Sheer Curtains','home-and-living-home-furnishing-curtains-sheer-curtains','Home & Living / Home Furnishing / Curtains / Sheer Curtains',90),
  ('Cushion Covers','home-and-living-home-furnishing-cushions-and-covers-cushion-covers','Home & Living / Home Furnishing / Cushions & Covers / Cushion Covers',91),
  ('Pillow Covers','home-and-living-home-furnishing-cushions-and-covers-pillow-covers','Home & Living / Home Furnishing / Cushions & Covers / Pillow Covers',92),
  ('Diwan Sets','home-and-living-home-furnishing-cushions-and-covers-diwan-sets','Home & Living / Home Furnishing / Cushions & Covers / Diwan Sets',93),
  ('Pans','home-and-living-kitchen-and-dining-cookware-pans','Home & Living / Kitchen & Dining / Cookware / Pans',94),
  ('Kadhai','home-and-living-kitchen-and-dining-cookware-kadhai','Home & Living / Kitchen & Dining / Cookware / Kadhai',95),
  ('Pressure Cookers','home-and-living-kitchen-and-dining-cookware-pressure-cookers','Home & Living / Kitchen & Dining / Cookware / Pressure Cookers',96),
  ('Dinner Sets','home-and-living-kitchen-and-dining-dinnerware-dinner-sets','Home & Living / Kitchen & Dining / Dinnerware / Dinner Sets',97),
  ('Plates','home-and-living-kitchen-and-dining-dinnerware-plates','Home & Living / Kitchen & Dining / Dinnerware / Plates',98),
  ('Bowls','home-and-living-kitchen-and-dining-dinnerware-bowls','Home & Living / Kitchen & Dining / Dinnerware / Bowls',99),
  ('Mugs','home-and-living-kitchen-and-dining-dinnerware-mugs','Home & Living / Kitchen & Dining / Dinnerware / Mugs',100),
  ('Containers','home-and-living-kitchen-and-dining-storage-containers','Home & Living / Kitchen & Dining / Storage / Containers',101),
  ('Jars','home-and-living-kitchen-and-dining-storage-jars','Home & Living / Kitchen & Dining / Storage / Jars',102),
  ('Lunch Boxes','home-and-living-kitchen-and-dining-storage-lunch-boxes','Home & Living / Kitchen & Dining / Storage / Lunch Boxes',103),
  ('Wall Stickers','home-and-living-decor-wall-decor-wall-stickers','Home & Living / Decor / Wall Decor / Wall Stickers',104),
  ('Paintings','home-and-living-decor-wall-decor-paintings','Home & Living / Decor / Wall Decor / Paintings',105),
  ('Clocks','home-and-living-decor-wall-decor-clocks','Home & Living / Decor / Wall Decor / Clocks',106),
  ('Lamps','home-and-living-decor-lighting-lamps','Home & Living / Decor / Lighting / Lamps',107),
  ('String Lights','home-and-living-decor-lighting-string-lights','Home & Living / Decor / Lighting / String Lights',108),
  ('Lanterns','home-and-living-decor-lighting-lanterns','Home & Living / Decor / Lighting / Lanterns',109),
  ('Artificial Plants','home-and-living-decor-plants-and-planters-artificial-plants','Home & Living / Decor / Plants & Planters / Artificial Plants',110),
  ('Planters','home-and-living-decor-plants-and-planters-planters','Home & Living / Decor / Plants & Planters / Planters',111),
  ('Vases','home-and-living-decor-plants-and-planters-vases','Home & Living / Decor / Plants & Planters / Vases',112),
  ('T-Shirts','kids-and-toys-kids-clothing-boys-clothing-t-shirts','Kids & Toys / Kids Clothing / Boys Clothing / T-Shirts',113),
  ('Shirts','kids-and-toys-kids-clothing-boys-clothing-shirts','Kids & Toys / Kids Clothing / Boys Clothing / Shirts',114),
  ('Jeans','kids-and-toys-kids-clothing-boys-clothing-jeans','Kids & Toys / Kids Clothing / Boys Clothing / Jeans',115),
  ('Ethnic Sets','kids-and-toys-kids-clothing-boys-clothing-ethnic-sets','Kids & Toys / Kids Clothing / Boys Clothing / Ethnic Sets',116),
  ('Frocks','kids-and-toys-kids-clothing-girls-clothing-frocks','Kids & Toys / Kids Clothing / Girls Clothing / Frocks',117),
  ('Tops','kids-and-toys-kids-clothing-girls-clothing-tops','Kids & Toys / Kids Clothing / Girls Clothing / Tops',118),
  ('Lehenga Cholis','kids-and-toys-kids-clothing-girls-clothing-lehenga-cholis','Kids & Toys / Kids Clothing / Girls Clothing / Lehenga Cholis',119),
  ('Leggings','kids-and-toys-kids-clothing-girls-clothing-leggings','Kids & Toys / Kids Clothing / Girls Clothing / Leggings',120),
  ('Rompers','kids-and-toys-kids-clothing-baby-clothing-rompers','Kids & Toys / Kids Clothing / Baby Clothing / Rompers',121),
  ('Bodysuits','kids-and-toys-kids-clothing-baby-clothing-bodysuits','Kids & Toys / Kids Clothing / Baby Clothing / Bodysuits',122),
  ('Sweaters','kids-and-toys-kids-clothing-baby-clothing-sweaters','Kids & Toys / Kids Clothing / Baby Clothing / Sweaters',123),
  ('Puzzles','kids-and-toys-toys-learning-toys-puzzles','Kids & Toys / Toys / Learning Toys / Puzzles',124),
  ('Flash Cards','kids-and-toys-toys-learning-toys-flash-cards','Kids & Toys / Toys / Learning Toys / Flash Cards',125),
  ('Activity Kits','kids-and-toys-toys-learning-toys-activity-kits','Kids & Toys / Toys / Learning Toys / Activity Kits',126),
  ('Teddy Bears','kids-and-toys-toys-soft-toys-teddy-bears','Kids & Toys / Toys / Soft Toys / Teddy Bears',127),
  ('Plush Animals','kids-and-toys-toys-soft-toys-plush-animals','Kids & Toys / Toys / Soft Toys / Plush Animals',128),
  ('Character Toys','kids-and-toys-toys-soft-toys-character-toys','Kids & Toys / Toys / Soft Toys / Character Toys',129),
  ('Ride Ons','kids-and-toys-toys-outdoor-toys-ride-ons','Kids & Toys / Toys / Outdoor Toys / Ride Ons',130),
  ('Sports Toys','kids-and-toys-toys-outdoor-toys-sports-toys','Kids & Toys / Toys / Outdoor Toys / Sports Toys',131),
  ('Water Toys','kids-and-toys-toys-outdoor-toys-water-toys','Kids & Toys / Toys / Outdoor Toys / Water Toys',132),
  ('Bottles','kids-and-toys-baby-care-feeding-bottles','Kids & Toys / Baby Care / Feeding / Bottles',133),
  ('Sippers','kids-and-toys-baby-care-feeding-sippers','Kids & Toys / Baby Care / Feeding / Sippers',134),
  ('Bibs','kids-and-toys-baby-care-feeding-bibs','Kids & Toys / Baby Care / Feeding / Bibs',135),
  ('Diapers','kids-and-toys-baby-care-diapering-diapers','Kids & Toys / Baby Care / Diapering / Diapers',136),
  ('Wipes','kids-and-toys-baby-care-diapering-wipes','Kids & Toys / Baby Care / Diapering / Wipes',137),
  ('Changing Mats','kids-and-toys-baby-care-diapering-changing-mats','Kids & Toys / Baby Care / Diapering / Changing Mats',138),
  ('Face Wash','personal-care-and-wellness-beauty-and-grooming-skin-care-face-wash','Personal Care & Wellness / Beauty & Grooming / Skin Care / Face Wash',139),
  ('Moisturizers','personal-care-and-wellness-beauty-and-grooming-skin-care-moisturizers','Personal Care & Wellness / Beauty & Grooming / Skin Care / Moisturizers',140),
  ('Sunscreen','personal-care-and-wellness-beauty-and-grooming-skin-care-sunscreen','Personal Care & Wellness / Beauty & Grooming / Skin Care / Sunscreen',141),
  ('Serums','personal-care-and-wellness-beauty-and-grooming-skin-care-serums','Personal Care & Wellness / Beauty & Grooming / Skin Care / Serums',142),
  ('Shampoo','personal-care-and-wellness-beauty-and-grooming-hair-care-shampoo','Personal Care & Wellness / Beauty & Grooming / Hair Care / Shampoo',143),
  ('Conditioner','personal-care-and-wellness-beauty-and-grooming-hair-care-conditioner','Personal Care & Wellness / Beauty & Grooming / Hair Care / Conditioner',144),
  ('Hair Oil','personal-care-and-wellness-beauty-and-grooming-hair-care-hair-oil','Personal Care & Wellness / Beauty & Grooming / Hair Care / Hair Oil',145),
  ('Hair Color','personal-care-and-wellness-beauty-and-grooming-hair-care-hair-color','Personal Care & Wellness / Beauty & Grooming / Hair Care / Hair Color',146),
  ('Lipstick','personal-care-and-wellness-beauty-and-grooming-makeup-lipstick','Personal Care & Wellness / Beauty & Grooming / Makeup / Lipstick',147),
  ('Foundation','personal-care-and-wellness-beauty-and-grooming-makeup-foundation','Personal Care & Wellness / Beauty & Grooming / Makeup / Foundation',148),
  ('Kajal','personal-care-and-wellness-beauty-and-grooming-makeup-kajal','Personal Care & Wellness / Beauty & Grooming / Makeup / Kajal',149),
  ('Nail Polish','personal-care-and-wellness-beauty-and-grooming-makeup-nail-polish','Personal Care & Wellness / Beauty & Grooming / Makeup / Nail Polish',150),
  ('Vitamins','personal-care-and-wellness-wellness-health-supplements-vitamins','Personal Care & Wellness / Wellness / Health Supplements / Vitamins',151),
  ('Protein','personal-care-and-wellness-wellness-health-supplements-protein','Personal Care & Wellness / Wellness / Health Supplements / Protein',152),
  ('Ayurvedic Supplements','personal-care-and-wellness-wellness-health-supplements-ayurvedic-supplements','Personal Care & Wellness / Wellness / Health Supplements / Ayurvedic Supplements',153),
  ('Sanitary Pads','personal-care-and-wellness-wellness-personal-hygiene-sanitary-pads','Personal Care & Wellness / Wellness / Personal Hygiene / Sanitary Pads',154),
  ('Hand Wash','personal-care-and-wellness-wellness-personal-hygiene-hand-wash','Personal Care & Wellness / Wellness / Personal Hygiene / Hand Wash',155),
  ('Body Wash','personal-care-and-wellness-wellness-personal-hygiene-body-wash','Personal Care & Wellness / Wellness / Personal Hygiene / Body Wash',156),
  ('Yoga Mats','personal-care-and-wellness-wellness-fitness-yoga-mats','Personal Care & Wellness / Wellness / Fitness / Yoga Mats',157),
  ('Resistance Bands','personal-care-and-wellness-wellness-fitness-resistance-bands','Personal Care & Wellness / Wellness / Fitness / Resistance Bands',158),
  ('Massagers','personal-care-and-wellness-wellness-fitness-massagers','Personal Care & Wellness / Wellness / Fitness / Massagers',159),
  ('Android Phones','mobiles-and-tablets-mobiles-smartphones-android-phones','Mobiles & Tablets / Mobiles / Smartphones / Android Phones',160),
  ('Feature Phones','mobiles-and-tablets-mobiles-smartphones-feature-phones','Mobiles & Tablets / Mobiles / Smartphones / Feature Phones',161),
  ('Refurbished Phones','mobiles-and-tablets-mobiles-smartphones-refurbished-phones','Mobiles & Tablets / Mobiles / Smartphones / Refurbished Phones',162),
  ('Cases & Covers','mobiles-and-tablets-mobiles-mobile-accessories-cases-and-covers','Mobiles & Tablets / Mobiles / Mobile Accessories / Cases & Covers',163),
  ('Screen Guards','mobiles-and-tablets-mobiles-mobile-accessories-screen-guards','Mobiles & Tablets / Mobiles / Mobile Accessories / Screen Guards',164),
  ('Chargers','mobiles-and-tablets-mobiles-mobile-accessories-chargers','Mobiles & Tablets / Mobiles / Mobile Accessories / Chargers',165),
  ('Data Cables','mobiles-and-tablets-mobiles-mobile-accessories-data-cables','Mobiles & Tablets / Mobiles / Mobile Accessories / Data Cables',166),
  ('Android Tablets','mobiles-and-tablets-tablets-tablets-android-tablets','Mobiles & Tablets / Tablets / Tablets / Android Tablets',167),
  ('Kids Tablets','mobiles-and-tablets-tablets-tablets-kids-tablets','Mobiles & Tablets / Tablets / Tablets / Kids Tablets',168),
  ('Tablet Accessories','mobiles-and-tablets-tablets-tablets-tablet-accessories','Mobiles & Tablets / Tablets / Tablets / Tablet Accessories',169),
  ('Power Banks','mobiles-and-tablets-tablets-power-and-audio-power-banks','Mobiles & Tablets / Tablets / Power & Audio / Power Banks',170),
  ('Earphones','mobiles-and-tablets-tablets-power-and-audio-earphones','Mobiles & Tablets / Tablets / Power & Audio / Earphones',171),
  ('Bluetooth Speakers','mobiles-and-tablets-tablets-power-and-audio-bluetooth-speakers','Mobiles & Tablets / Tablets / Power & Audio / Bluetooth Speakers',172),
  ('Mixer Grinders','consumer-electronics-appliances-kitchen-appliances-mixer-grinders','Consumer Electronics / Appliances / Kitchen Appliances / Mixer Grinders',173),
  ('Electric Kettles','consumer-electronics-appliances-kitchen-appliances-electric-kettles','Consumer Electronics / Appliances / Kitchen Appliances / Electric Kettles',174),
  ('Induction Cooktops','consumer-electronics-appliances-kitchen-appliances-induction-cooktops','Consumer Electronics / Appliances / Kitchen Appliances / Induction Cooktops',175),
  ('Irons','consumer-electronics-appliances-home-appliances-irons','Consumer Electronics / Appliances / Home Appliances / Irons',176),
  ('Fans','consumer-electronics-appliances-home-appliances-fans','Consumer Electronics / Appliances / Home Appliances / Fans',177),
  ('Vacuum Cleaners','consumer-electronics-appliances-home-appliances-vacuum-cleaners','Consumer Electronics / Appliances / Home Appliances / Vacuum Cleaners',178),
  ('Trimmers','consumer-electronics-appliances-personal-appliances-trimmers','Consumer Electronics / Appliances / Personal Appliances / Trimmers',179),
  ('Hair Dryers','consumer-electronics-appliances-personal-appliances-hair-dryers','Consumer Electronics / Appliances / Personal Appliances / Hair Dryers',180),
  ('Straighteners','consumer-electronics-appliances-personal-appliances-straighteners','Consumer Electronics / Appliances / Personal Appliances / Straighteners',181),
  ('Headphones','consumer-electronics-electronics-accessories-audio-headphones','Consumer Electronics / Electronics Accessories / Audio / Headphones',182),
  ('Neckbands','consumer-electronics-electronics-accessories-audio-neckbands','Consumer Electronics / Electronics Accessories / Audio / Neckbands',183),
  ('Speakers','consumer-electronics-electronics-accessories-audio-speakers','Consumer Electronics / Electronics Accessories / Audio / Speakers',184),
  ('Keyboards','consumer-electronics-electronics-accessories-computer-accessories-keyboards','Consumer Electronics / Electronics Accessories / Computer Accessories / Keyboards',185),
  ('Mouse','consumer-electronics-electronics-accessories-computer-accessories-mouse','Consumer Electronics / Electronics Accessories / Computer Accessories / Mouse',186),
  ('USB Hubs','consumer-electronics-electronics-accessories-computer-accessories-usb-hubs','Consumer Electronics / Electronics Accessories / Computer Accessories / USB Hubs',187),
  ('CCTV Cameras','consumer-electronics-electronics-accessories-cameras-and-security-cctv-cameras','Consumer Electronics / Electronics Accessories / Cameras & Security / CCTV Cameras',188),
  ('Action Cameras','consumer-electronics-electronics-accessories-cameras-and-security-action-cameras','Consumer Electronics / Electronics Accessories / Cameras & Security / Action Cameras',189),
  ('Smart Doorbells','consumer-electronics-electronics-accessories-cameras-and-security-smart-doorbells','Consumer Electronics / Electronics Accessories / Cameras & Security / Smart Doorbells',190),
  ('A5 Notebooks','office-supplies-and-stationery-paper-products-notebooks-a5-notebooks','Office Supplies & Stationery / Paper Products / Notebooks / A5 Notebooks',191),
  ('Registers','office-supplies-and-stationery-paper-products-notebooks-registers','Office Supplies & Stationery / Paper Products / Notebooks / Registers',192),
  ('Diaries','office-supplies-and-stationery-paper-products-notebooks-diaries','Office Supplies & Stationery / Paper Products / Notebooks / Diaries',193),
  ('Document Files','office-supplies-and-stationery-paper-products-files-and-folders-document-files','Office Supplies & Stationery / Paper Products / Files & Folders / Document Files',194),
  ('Folders','office-supplies-and-stationery-paper-products-files-and-folders-folders','Office Supplies & Stationery / Paper Products / Files & Folders / Folders',195),
  ('Clipboards','office-supplies-and-stationery-paper-products-files-and-folders-clipboards','Office Supplies & Stationery / Paper Products / Files & Folders / Clipboards',196),
  ('Ball Pens','office-supplies-and-stationery-writing-instruments-pens-ball-pens','Office Supplies & Stationery / Writing Instruments / Pens / Ball Pens',197),
  ('Gel Pens','office-supplies-and-stationery-writing-instruments-pens-gel-pens','Office Supplies & Stationery / Writing Instruments / Pens / Gel Pens',198),
  ('Metal Pens','office-supplies-and-stationery-writing-instruments-pens-metal-pens','Office Supplies & Stationery / Writing Instruments / Pens / Metal Pens',199),
  ('Wooden Pencils','office-supplies-and-stationery-writing-instruments-pencils-wooden-pencils','Office Supplies & Stationery / Writing Instruments / Pencils / Wooden Pencils',200),
  ('Mechanical Pencils','office-supplies-and-stationery-writing-instruments-pencils-mechanical-pencils','Office Supplies & Stationery / Writing Instruments / Pencils / Mechanical Pencils',201),
  ('Color Pencils','office-supplies-and-stationery-writing-instruments-pencils-color-pencils','Office Supplies & Stationery / Writing Instruments / Pencils / Color Pencils',202);

INSERT INTO public.categories (name, slug, description, sort_order)
SELECT name, slug, description, sort_order
FROM meesho_category_seed
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

WITH product_category_map (product_slug, category_slug) AS (
  VALUES
    ('linen-overshirt', 'men-fashion-mens-clothing-top-wear-casual-shirts'),
    ('merino-crewneck', 'men-fashion-top-wear-t-shirts-round-neck-t-shirts'),
    ('leather-card-holder', 'men-fashion-accessories-wallets-card-holders'),
    ('canvas-tote', 'women-fashion-jewellery-and-accessories-bags-handbags'),
    ('ceramic-mug-set', 'home-and-living-kitchen-and-dining-dinnerware-mugs'),
    ('linen-throw', 'home-and-living-home-furnishing-cushions-and-covers-cushion-covers'),
    ('a5-notebook', 'office-supplies-and-stationery-paper-products-notebooks-a5-notebooks'),
    ('brass-pen', 'office-supplies-and-stationery-writing-instruments-pens-metal-pens')
)
UPDATE public.products p
SET category_id = c.id
FROM product_category_map m
JOIN public.categories c ON c.slug = m.category_slug
WHERE p.slug = m.product_slug;

-- Move any user-created products still assigned to the old broad categories onto reasonable Meesho leaves.
UPDATE public.products p
SET category_id = c.id
FROM public.categories old_category
JOIN public.categories c ON c.slug = 'men-fashion-mens-clothing-top-wear-casual-shirts'
WHERE p.category_id = old_category.id AND old_category.slug = 'apparel';

UPDATE public.products p
SET category_id = c.id
FROM public.categories old_category
JOIN public.categories c ON c.slug = 'men-fashion-accessories-wallets-card-holders'
WHERE p.category_id = old_category.id AND old_category.slug = 'accessories';

UPDATE public.products p
SET category_id = c.id
FROM public.categories old_category
JOIN public.categories c ON c.slug = 'home-and-living-decor-plants-and-planters-vases'
WHERE p.category_id = old_category.id AND old_category.slug = 'home';

UPDATE public.products p
SET category_id = c.id
FROM public.categories old_category
JOIN public.categories c ON c.slug = 'office-supplies-and-stationery-paper-products-notebooks-a5-notebooks'
WHERE p.category_id = old_category.id AND old_category.slug = 'stationery';

DELETE FROM public.categories
WHERE slug IN ('apparel', 'accessories', 'home', 'stationery');

COMMIT;
