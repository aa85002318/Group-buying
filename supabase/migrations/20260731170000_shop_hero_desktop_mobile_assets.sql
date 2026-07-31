-- Point shop_hero CMS rows at separate desktop (5:2) / mobile (6:5) assets
UPDATE cms_banners
SET
  image_url = '/images/shop/hero-desktop.jpg',
  mobile_image_url = '/images/shop/hero-mobile.jpg'
WHERE placement = 'shop_hero'
   OR banner_type = 'shop_hero';
