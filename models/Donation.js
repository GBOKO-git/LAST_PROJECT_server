const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'donorModel',
    required: true
  },
  donorModel: {
    type: String,
    required: true,
    enum: ['User', 'Donor']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['paypal', 'card', 'bank_transfer']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  campaign: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index pour la recherche
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ campaign: 1 });

// Méthodes statiques
donationSchema.statics.getTotalDonations = async function() {
  return this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

donationSchema.statics.getDonationsByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Méthodes d'instance
donationSchema.methods.markAsCompleted = async function() {
  this.status = 'completed';
  // Mettre à jour le montant cumulé du donateur
  if (this.donorModel === 'Donor') {
    const Donor = mongoose.model('Donor');
    const donor = await Donor.findById(this.donor);
    if (donor) {
      await donor.updateMontantCumule(this.amount);
    }
  }
  return this.save();
};

donationSchema.methods.markAsRefunded = async function() {
  this.status = 'refunded';
  return this.save();
};

// Middleware pre-save
donationSchema.pre('save', function(next) {
  if (this.isAnonymous) {
    this.donor = undefined;
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema); 