const { Contact } = require('../models');
const crmService = require('../services/crmAnalyticsService');

exports.getProfile = async (req, res, next) => {
  try {
    const c = await Contact.findById(req.params.customerId);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json({
      partyType: c.partyType, businessType: c.businessType,
      country: c.country, personalPreferences: c.personalPreferences, city: c.city,
    });
  } catch (e) { next(e); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { partyType, businessType, country, personalPreferences, city } = req.body;
    const c = await Contact.findByIdAndUpdate(
      req.params.customerId,
      { partyType, businessType, country, personalPreferences, city },
      { new: true }
    );
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Profile updated' });
  } catch (e) { next(e); }
};

exports.analytics = async (req, res, next) => {
  try {
    const id = req.params.customerId;
    const [frequentlyBought, latestNewProduct, droppedItems] = await Promise.all([
      crmService.getFrequentlyBought(id),
      crmService.getLatestNewProduct(id),
      crmService.getDroppedItems(id),
    ]);
    res.json({ frequentlyBought, latestNewProduct, droppedItems });
  } catch (e) { next(e); }
};

exports.frequentlyBought  = async (req, res, next) => { try { res.json(await crmService.getFrequentlyBought(req.params.customerId)); } catch (e) { next(e); } };
exports.droppedItems      = async (req, res, next) => { try { res.json(await crmService.getDroppedItems(req.params.customerId)); } catch (e) { next(e); } };
exports.latestNewProduct  = async (req, res, next) => { try { res.json(await crmService.getLatestNewProduct(req.params.customerId)); } catch (e) { next(e); } };
