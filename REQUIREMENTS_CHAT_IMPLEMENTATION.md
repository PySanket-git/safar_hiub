# Requirements and Chat System Implementation

## Overview
This implementation adds a complete requirements posting and vendor-user chat system to the travel platform. Users can post requirements, vendors can view matching requirements based on their service categories, and both parties can communicate through a real-time chat interface.

## Features Implemented

### 1. User Profile - Post Requirement Button
- Added "Post Requirement" button in user profile page
- Location: `/app/profile/page.tsx`
- Button navigates to `/profile/requirements`

### 2. User Requirements Page
- Complete requirements management interface
- Location: `/app/profile/requirements/page.tsx`
- Features:
  - View all user's posted requirements
  - Create new requirements with form
  - Form fields:
    - Title (required)
    - Description (optional)
    - Categories (required, multi-select):
      - Stays
      - Adventure
      - Tours
      - Vehicle Rental
      - Market Place
  - View responses from vendors
  - Navigate to chat with vendors

### 3. Vendor Requirements Page
- Shows requirements matching vendor's service categories
- Location: `/app/vendor/requirements/page.tsx`
- Features:
  - Auto-filtered based on vendor's `vendorServices` array
  - Shows customer details (name, email, avatar)
  - Category matching logic:
    - `stays` → stays
    - `tours` → tours/tour
    - `adventures` → adventure
    - `vehicle-rental` → vehicle-rental
    - `products` (seller) → market-place
  - "Chat with Customer" button for each requirement

### 4. Vendor Sidebar Integration
- Added "Requirements" menu item to vendor sidebar
- Location: `/app/components/Pages/vendor/Sidebar.tsx`
- Icon: ClipboardList from lucide-react
- Route: `/vendor/requirements`

### 5. Chat/Messaging System

#### Models
- **Message Model** (`/models/Message.ts`):
  - Fields: requirementId, sender, receiver, message, createdAt
  - Indexed for performance
  - Populated with user details

#### API Endpoints
- **GET/POST `/api/messages/route.ts`**:
  - GET: Fetch messages between two users for a requirement
  - POST: Send a new message
  - Both protected by auth middleware

- **GET `/api/requirements/user/route.ts`**:
  - Fetch user's own requirements

- **GET `/api/requirements/vendor/route.ts`**:
  - Fetch requirements matching vendor's categories
  - Auto-filters based on vendor's services

#### Chat Interfaces

**Vendor Chat** (`/app/vendor/requirements/[id]/chat/page.tsx`):
- Real-time message display
- Message polling (every 3 seconds)
- Send messages to customers
- Visual distinction between sent/received messages
- Auto-scroll to latest message
- Back navigation to requirements list

**User Chat** (`/app/profile/requirements/[id]/chat/page.tsx`):
- List of all vendors who responded
- Select vendor to view conversation
- Real-time message display
- Message polling (every 3 seconds)
- Send messages to vendors
- Visual distinction between sent/received messages
- Auto-scroll to latest message

### 6. Socket.io Preparation
- Created socket context hook: `/app/hooks/useSocket.tsx`
- Currently uses polling (3-second intervals)
- Ready for Socket.io integration when needed
- To integrate Socket.io:
  1. Install: `npm install socket.io socket.io-client`
  2. Create server in `/pages/api/socket.ts` (Next.js API route)
  3. Update useSocket hook to use actual socket connection
  4. Emit/listen for 'new-message' events

## Database Models

### UserRequirement Model
```typescript
{
  user: ObjectId (ref: User)
  title: String (required)
  description: String
  categories: [String] (enum: stays, adventure, tour, vehicle-rental, market-place, tours, products)
  createdAt: Date
}
```

### Message Model
```typescript
{
  requirementId: ObjectId (ref: UserRequirement)
  sender: ObjectId (ref: User)
  receiver: ObjectId (ref: User)
  message: String (required)
  createdAt: Date
}
```

## Category Mapping
The system maps vendor services to requirement categories:

```javascript
{
  "stays": ["stays"],
  "tours": ["tours", "tour"],
  "adventures": ["adventure"],
  "vehicle-rental": ["vehicle-rental"],
  "products": ["market-place"]
}
```

Sellers (vendors with `isSeller: true`) also see "market-place" requirements.

## User Flow

### For Users:
1. Go to Profile → Click "Post Requirement"
2. Fill form with title, description, and categories
3. Submit requirement
4. View requirement in My Requirements
5. Click "View Responses" to see vendor messages
6. Select a vendor and chat with them

### For Vendors:
1. Navigate to "Requirements" in sidebar
2. See requirements matching their service categories
3. View customer details
4. Click "Chat with Customer"
5. Send messages to discuss the requirement

## API Routes Summary

| Route | Method | Description | Auth |
|-------|--------|-------------|------|
| `/api/requirements` | GET | Get all requirements | No |
| `/api/requirements` | POST | Create new requirement | Yes (User) |
| `/api/requirements/user` | GET | Get user's requirements | Yes (User) |
| `/api/requirements/vendor` | GET | Get matching requirements for vendor | Yes (Vendor) |
| `/api/messages` | GET | Get messages for a requirement | Yes |
| `/api/messages` | POST | Send a message | Yes |

## UI Components

### Colors & Styling
- **User Interface**: Purple theme (#A855F7, #EC4899)
- **Vendor Interface**: Green theme (#10B981, #059669)
- **Rounded corners**: 2xl (1rem)
- **Shadows**: md, lg, xl for depth
- **Responsive**: Mobile-first design with Tailwind breakpoints

### Icons Used
- `react-icons/fi`: FiPlus, FiMessageSquare, FiSend, FiRefreshCw, FiArrowLeft
- `lucide-react`: ClipboardList (sidebar)

## Future Enhancements

### Real-time Socket.io Integration
To add true real-time messaging:

1. **Install Socket.io**:
```bash
npm install socket.io socket.io-client
```

2. **Create Socket Server** (`/pages/api/socket.ts`):
```typescript
import { Server } from 'socket.io';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    
    io.on('connection', (socket) => {
      socket.on('join-requirement', (requirementId) => {
        socket.join(`requirement-${requirementId}`);
      });
      
      socket.on('send-message', (data) => {
        io.to(`requirement-${data.requirementId}`).emit('new-message', data);
      });
    });
    
    res.socket.server.io = io;
  }
  res.end();
}
```

3. **Update useSocket Hook** to connect to Socket.io server
4. **Remove polling** from chat pages

### Additional Features
- Message notifications
- Unread message count badges
- File/image sharing in chat
- Requirement status (open/closed)
- Vendor ratings after chat completion
- Search/filter requirements
- Email notifications for new messages

## Testing

### Test User Flow:
1. Create a user account
2. Post a requirement with "Stays" category
3. Switch to a vendor account with "stays" in vendorServices
4. Check vendor requirements page - should see the requirement
5. Click "Chat with Customer"
6. Send a message
7. Switch back to user account
8. View responses on the requirement
9. Reply to the vendor

### Test Category Matching:
- Vendor with `vendorServices: ["stays"]` should see requirements with `categories: ["stays"]`
- Vendor with `vendorServices: ["tours"]` should see requirements with `categories: ["tours", "tour"]`
- Vendor with `isSeller: true` should see requirements with `categories: ["market-place"]`

## Files Created/Modified

### Created:
- `/app/profile/requirements/page.tsx`
- `/app/profile/requirements/[id]/chat/page.tsx`
- `/app/vendor/requirements/page.tsx` (updated existing)
- `/app/vendor/requirements/[id]/chat/page.tsx`
- `/app/api/requirements/user/route.ts`
- `/app/api/requirements/vendor/route.ts`
- `/app/api/messages/route.ts`
- `/models/Message.ts`
- `/app/hooks/useSocket.tsx`
- `REQUIREMENTS_CHAT_IMPLEMENTATION.md` (this file)

### Modified:
- `/app/profile/page.tsx` - Added Post Requirement button
- `/app/components/Pages/vendor/Sidebar.tsx` - Added Requirements menu item

## Support
For issues or questions, refer to the codebase or contact the development team.
