# Requirements Posting and Vendor Chat System

## Overview
This feature allows users to post their travel requirements and enables vendors to view and respond to requirements that match their service categories through a real-time chat system.

## Features Implemented

### 1. User Features
- **Post Requirement Button**: Added to user profile page
- **Requirements Page**: Form to create new requirements with:
  - Title (required)
  - Description (optional)
  - Category selection (Stays, Adventure, Tours, Vehicle Rental, Market Place)
- **View Requirements**: List of all user's posted requirements
- **Chat with Vendors**: Real-time messaging with vendors who respond to requirements

### 2. Vendor Features
- **Requirements Tab**: New menu item in vendor sidebar
- **Filtered Requirements**: Vendors only see requirements matching their service categories
- **Category Mapping**:
  - Vendor "stays" → User "stays"
  - Vendor "tours" → User "tours", "tour"
  - Vendor "adventures" → User "adventure"
  - Vendor "vehicle-rental" → User "vehicle-rental"
  - Vendor "products" or isSeller → User "market-place"
- **Chat with Users**: Direct messaging with users about their requirements

### 3. Chat System
- Real-time messaging between users and vendors
- Message history stored in database
- Auto-refresh (polling every 3 seconds)
- User-friendly interface with message bubbles
- Vendor list for users to see all responding vendors

## File Structure

### Models
- `models/Message.ts` - Message schema for chat functionality
- `models/Userrequirement.ts` - Updated requirement schema

### API Routes
- `app/api/requirements/route.ts` - Get all requirements, POST new requirement
- `app/api/requirements/user/route.ts` - Get user's own requirements
- `app/api/requirements/vendor/route.ts` - Get requirements matching vendor's services
- `app/api/messages/route.ts` - GET messages, POST new message

### User Pages
- `app/profile/page.tsx` - Added "Post Requirement" button
- `app/profile/requirements/page.tsx` - Requirements list and creation form
- `app/profile/requirements/[id]/chat/page.tsx` - Chat interface for users

### Vendor Pages
- `app/vendor/requirements/page.tsx` - View matching requirements
- `app/vendor/requirements/[id]/chat/page.tsx` - Chat interface for vendors

### Components
- `app/components/Pages/vendor/Sidebar.tsx` - Added Requirements menu item
- `app/hooks/useSocket.tsx` - Socket context for real-time updates

## Usage Flow

### For Users:
1. Navigate to Profile page
2. Click "Post Requirement" button
3. Fill out the requirement form:
   - Enter a descriptive title
   - Add details in description
   - Select one or more categories
4. Click "Post Requirement"
5. View posted requirements on the Requirements page
6. Click "View Responses" to see vendor messages
7. Select a vendor from the list to chat with them

### For Vendors:
1. Navigate to "Requirements" from sidebar
2. View requirements matching your services
3. See customer information and requirement details
4. Click "Chat with Customer" to start a conversation
5. Send and receive messages in real-time

## Database Schema

### Message Collection
```typescript
{
  requirementId: ObjectId (ref: UserRequirement),
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  message: String,
  createdAt: Date
}
```

### UserRequirement Collection
```typescript
{
  user: ObjectId (ref: User),
  title: String,
  description: String,
  categories: [String], // enum values
  comments: [CommentSchema],
  createdAt: Date
}
```

## API Endpoints

### GET /api/requirements
Returns all requirements (public access)

### POST /api/requirements
Create a new requirement (requires auth)
Body: `{ title, categories, description }`

### GET /api/requirements/user
Get logged-in user's requirements (requires auth)

### GET /api/requirements/vendor
Get requirements matching vendor's services (requires vendor auth)

### GET /api/messages?requirementId=XXX&userId=YYY
Get messages between two users for a requirement (requires auth)

### POST /api/messages
Send a new message (requires auth)
Body: `{ requirementId, receiverId, message }`

## Technical Details

### Authentication
All endpoints use the `auth` middleware to verify user authentication via JWT tokens.

### Category Matching Logic
The vendor requirements API maps vendor services to requirement categories:
```typescript
const categoryMap = {
  "stays": ["stays"],
  "tours": ["tours", "tour"],
  "adventures": ["adventure"],
  "vehicle-rental": ["vehicle-rental"],
  "products": ["market-place"],
};
```

### Real-time Updates
Currently using polling (every 3 seconds) for message updates. Can be upgraded to Socket.io for true real-time functionality.

### Security
- All routes protected with authentication
- Users can only see their own requirements
- Vendors can only see requirements matching their services
- Messages are private between sender and receiver

## Future Enhancements

1. **Socket.io Integration**: Replace polling with WebSocket for true real-time messaging
2. **Notifications**: Email/push notifications when vendors respond
3. **File Attachments**: Allow users to attach images/documents to requirements
4. **Requirement Status**: Add status tracking (open, in-progress, closed)
5. **Vendor Ratings**: Allow users to rate vendors they've chatted with
6. **Search & Filters**: Add search and filtering for requirements
7. **Typing Indicators**: Show when the other person is typing
8. **Read Receipts**: Show message read status
9. **Message Attachments**: Allow sending images in chat

## Testing Checklist

- [ ] User can post a requirement
- [ ] Requirement appears in user's requirements list
- [ ] Vendor sees requirements matching their services
- [ ] Vendor can start a chat with user
- [ ] Messages are sent and received correctly
- [ ] Chat history persists after page refresh
- [ ] Multiple vendors can chat with same user
- [ ] User can switch between vendor chats
- [ ] Categories are properly mapped
- [ ] Authentication works on all endpoints
