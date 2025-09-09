class OfferBanner {
  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String offerCode;
  final String actionUrl;
  final String backgroundColor;

  OfferBanner({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.offerCode,
    required this.actionUrl,
    required this.backgroundColor,
  });

  factory OfferBanner.fromJson(Map<String, dynamic> json) {
    return OfferBanner(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String,
      imageUrl: json['imageUrl'] as String,
      offerCode: json['offerCode'] as String,
      actionUrl: json['actionUrl'] as String,
      backgroundColor: json['backgroundColor'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'imageUrl': imageUrl,
      'offerCode': offerCode,
      'actionUrl': actionUrl,
      'backgroundColor': backgroundColor,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is OfferBanner &&
        other.id == id &&
        other.title == title &&
        other.subtitle == subtitle &&
        other.imageUrl == imageUrl &&
        other.offerCode == offerCode &&
        other.actionUrl == actionUrl &&
        other.backgroundColor == backgroundColor;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        title.hashCode ^
        subtitle.hashCode ^
        imageUrl.hashCode ^
        offerCode.hashCode ^
        actionUrl.hashCode ^
        backgroundColor.hashCode;
  }

  @override
  String toString() {
    return 'OfferBanner(id: $id, title: $title, subtitle: $subtitle, imageUrl: $imageUrl, offerCode: $offerCode, actionUrl: $actionUrl, backgroundColor: $backgroundColor)';
  }
}